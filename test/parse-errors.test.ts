import { describe, expect, test } from 'vitest';
import { execute } from '../src/lib/machine/execute.js';
import { parse } from '../src/lib/machine/parse.js';

/** Every static error in docs/machine.md §6, with its reported position. */
const errorsOf = (source: string) => {
  const result = parse(source);
  if (result.ok) throw new Error('expected a parse error, but parsing succeeded');
  return result.errors;
};

describe('parse errors', () => {
  test('reports an unknown mnemonic at its own column', () => {
    expect(errorsOf('  FROBNICATE R0, 1')).toEqual([
      { message: "unknown instruction 'FROBNICATE'", line: 1, col: 3 },
    ]);
  });

  test('rejects a register outside R0-R3', () => {
    expect(errorsOf('LOAD R9, 1')[0]?.message).toMatch(/register R0-R3/);
  });

  test('rejects an immediate above 255', () => {
    expect(errorsOf('LOAD R0, 256')[0]).toEqual({
      message: 'number must be 0-255',
      line: 1,
      col: 10,
    });
  });

  test('rejects a missing operand', () => {
    expect(errorsOf('LOAD R0,')[0]?.message).toMatch(/expected a number/);
  });

  test('rejects a bracket that never opens', () => {
    expect(errorsOf('STORE R2, R0')[0]?.message).toMatch(/expected '\['/);
  });

  test('rejects a bracket that never closes', () => {
    expect(errorsOf('STORE R2, [R0')[0]?.message).toMatch(/expected '\]'/);
  });

  test('rejects a jump to a label that does not exist', () => {
    expect(errorsOf('JMP nowhere')[0]?.message).toMatch(/undefined label 'nowhere'/);
  });

  test('rejects the same label declared twice', () => {
    expect(errorsOf('top: HALT\ntop: HALT')[0]?.message).toMatch(/duplicate label/);
  });

  test('rejects a missing jump target at end of source', () => {
    expect(errorsOf('JMP')[0]?.message).toMatch(/expected a jump target/);
  });

  test('rejects a program longer than 256 instructions', () => {
    const tooLong = Array(257).fill('HALT').join('\n');
    expect(errorsOf(tooLong)[0]?.message).toMatch(/longer than 256/);
  });

  test('reports errors on the line they occur', () => {
    const errors = errorsOf('HALT\nHALT\nLOAD R7, 1');
    expect(errors[0]?.line).toBe(3);
  });
});

describe('unknown opcodes', () => {
  test('an opcode with no meaning faults instead of being ignored', () => {
    // 0xF is not in the instruction set; encoded words can still contain it.
    const result = execute([0xf << 12]);
    expect(result.fault?.message).toMatch(/unknown opcode 0xf/);
  });
});
