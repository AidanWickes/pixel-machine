import { describe, expect, test } from 'vitest';
import { assemble, decode } from '../src/lib/machine/assemble.js';
import { parse } from '../src/lib/machine/parse.js';

const instructionsOf = (source: string) => {
  const result = parse(source);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.instructions;
};

describe('assemble', () => {
  test('packs opcode, rd, rs and immediate into a 16-bit word', () => {
    expect(assemble(instructionsOf('LOAD R0, 5'))).toEqual([0x1005]);
  });

  test('encodes HALT as 0x0000, so zeroed memory halts', () => {
    expect(assemble(instructionsOf('HALT'))).toEqual([0x0000]);
  });

  test('keeps rd and rs in distinct fields for STORE', () => {
    expect(assemble(instructionsOf('STORE R2, [R0]'))).toEqual([0x8200]);
  });
});

describe('round-trip', () => {
  test('decode reverses assemble for every operand form', () => {
    const source = [
      'loop: LOAD R3, 200',
      'STORE R2, [R1]',
      'ADDI R1, 7',
      'SUBI R3, 1',
      'JNZ R3, loop',
      'JZ R0, loop',
      'JMP loop',
      'HALT',
    ].join('\n');

    const original = instructionsOf(source);
    const restored = assemble(original).map(decode);

    expect(restored).toEqual(
      original.map(({ op, rd, rs, imm }) => ({ op, rd, rs, imm })),
    );
  });
});
