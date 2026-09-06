import { describe, expect, test } from 'vitest';
import { disassemble } from '../src/lib/machine/disassemble.js';
import { parse } from '../src/lib/machine/parse.js';

const instructionsOf = (source: string) => {
  const result = parse(source);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.instructions;
};

describe('disassemble', () => {
  test('renders each operand form readably', () => {
    const source = [
      'LOAD R0, 5',
      'LOADI R1, [R0]',
      'MOV R2, R1',
      'ADD R0, R1',
      'SUBI R3, 2',
      'STORE R2, [R0]',
      'JMP 0',
      'JNZ R3, 0',
      'HALT',
    ].join('\n');

    expect(disassemble(instructionsOf(source))).toEqual([
      '  0  LOAD R0, 5',
      '  1  LOADI R1, [R0]',
      '  2  MOV R2, R1',
      '  3  ADD R0, R1',
      '  4  SUBI R3, 2',
      '  5  STORE R2, [R0]',
      '  6  JMP 0',
      '  7  JNZ R3, 0',
      '  8  HALT',
    ]);
  });

  test('its output re-parses to the instructions it came from', () => {
    const original = instructionsOf(
      'loop: LOAD R3, 200\nSTORE R2, [R1]\nADDI R1, 7\nJZ R0, loop\nJMP loop\nHALT',
    );
    const text = disassemble(original)
      .map((line) => line.replace(/^\s*\d+\s\s/, ''))
      .join('\n');

    const restored = instructionsOf(text);
    expect(restored.map(({ op, rd, rs, imm }) => ({ op, rd, rs, imm }))).toEqual(
      original.map(({ op, rd, rs, imm }) => ({ op, rd, rs, imm })),
    );
  });
});
