import { describe, expect, test } from 'vitest';
import { parse } from '../src/lib/machine/parse.js';

describe('parse', () => {
  test('parses LOAD into an instruction with its opcode from machine.md', () => {
    const result = parse('LOAD R0, 5');
    expect(result).toEqual({
      ok: true,
      instructions: [{ op: 0x1, rd: 0, rs: 0, imm: 5, line: 1 }],
    });
  });
});

describe('parse STORE', () => {
  test('puts the colour in rs and the address in rd', () => {
    const result = parse('STORE R2, [R0]');
    expect(result).toEqual({
      ok: true,
      instructions: [{ op: 0x8, rd: 0, rs: 2, imm: 0, line: 1 }],
    });
  });
});

describe('parse immediate arithmetic', () => {
  test('parses ADDI and SUBI across multiple lines', () => {
    const result = parse('ADDI R0, 1\nSUBI R1, 1');
    expect(result).toEqual({
      ok: true,
      instructions: [
        { op: 0x5, rd: 0, rs: 0, imm: 1, line: 1 },
        { op: 0x7, rd: 1, rs: 0, imm: 1, line: 2 },
      ],
    });
  });
});

describe('parse HALT', () => {
  test('parses HALT with no operands', () => {
    const result = parse('HALT');
    expect(result).toEqual({
      ok: true,
      instructions: [{ op: 0x0, rd: 0, rs: 0, imm: 0, line: 1 }],
    });
  });
});

describe('parse labels', () => {
  test('resolves a label to its instruction index', () => {
    const result = parse('loop: STORE R2, [R0]\n      JNZ R1, loop');
    expect(result).toEqual({
      ok: true,
      instructions: [
        { op: 0x8, rd: 0, rs: 2, imm: 0, line: 1 },
        { op: 0xa, rd: 0, rs: 1, imm: 0, line: 2 },
      ],
    });
  });

  test('resolves a forward reference declared later in the source', () => {
    const result = parse('JZ R1, done\nHALT\ndone: HALT');
    expect(result.ok && result.instructions[0]?.imm).toBe(2);
  });
});
