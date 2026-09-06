import type { Instruction } from './parse.js';

/**
 * Fixed 16-bit words. See docs/machine.md §3.
 *
 *  15    12 11 10  9  8  7                     0
 * ┌────────┬─────┬─────┬───────────────────────┐
 * │ opcode │ rd  │ rs  │       immediate       │
 * └────────┴─────┴─────┴───────────────────────┘
 */
export interface Decoded {
  op: number;
  rd: number;
  rs: number;
  imm: number;
}

export function assemble(instructions: Instruction[]): number[] {
  return instructions.map(
    ({ op, rd, rs, imm }) => (op << 12) | (rd << 10) | (rs << 8) | imm,
  );
}

export function decode(word: number): Decoded {
  return {
    op: (word >> 12) & 0xf,
    rd: (word >> 10) & 0x3,
    rs: (word >> 8) & 0x3,
    imm: word & 0xff,
  };
}
