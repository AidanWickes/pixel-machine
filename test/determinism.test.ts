import { describe, expect, test } from 'vitest';
import { run } from './helpers.js';

/**
 * The leaderboard is only honest if the browser and the server agree on what
 * a program does. These guard that invariant; they passed the moment they were
 * written, which is the point — they exist to fail if purity is ever broken.
 */
const PROGRAMS = [
  'LOAD R0, 0\nLOAD R1, 8\nLOAD R2, BLUE\nloop: STORE R2, [R0]\nADDI R0, 1\nSUBI R1, 1\nJNZ R1, loop\nHALT',
  'LOAD R0, 63\nLOAD R2, YELLOW\nSTORE R2, [R0]\nHALT',
  'loop: JMP loop',
];

describe('determinism', () => {
  test.each(PROGRAMS)('repeated runs agree exactly (%#)', (source) => {
    const first = run(source);
    const second = run(source);
    const third = run(source);

    expect(second).toEqual(first);
    expect(third).toEqual(first);
  });

  test('cycle counts are stable across runs', () => {
    const counts = PROGRAMS.map((source) => run(source).cycles);
    const again = PROGRAMS.map((source) => run(source).cycles);
    expect(again).toEqual(counts);
  });
});
