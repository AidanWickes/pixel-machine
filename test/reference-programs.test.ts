import { describe, expect, test } from 'vitest';
import { assemble } from '../src/lib/machine/assemble.js';
import { execute } from '../src/lib/machine/execute.js';
import { parse } from '../src/lib/machine/parse.js';
import { draw } from './helpers.js';

/** The worked example from docs/machine.md §4, verbatim. */
const BLUE_TOP_ROW = [
  '; draw a blue row across the top',
  '        LOAD  R0, 0          ; R0 = cursor address',
  '        LOAD  R1, 8          ; R1 = counter',
  '        LOAD  R2, BLUE       ; R2 = colour',
  'loop:   STORE R2, [R0]',
  '        ADDI  R0, 1',
  '        SUBI  R1, 1',
  '        JNZ   R1, loop',
  '        HALT',
].join('\n');

describe('the documented example program', () => {
  const result = parse(BLUE_TOP_ROW);
  if (!result.ok) throw new Error(JSON.stringify(result.errors, null, 2));
  const run = execute(assemble(result.instructions));

  test('paints the top row blue and nothing else', () => {
    expect(run.grid.slice(0, 8)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(run.grid.slice(8).every((cell) => cell === 0)).toBe(true);
  });

  test('runs without faulting', () => {
    expect(run.fault).toBeUndefined();
  });

  test('costs 36 cycles: 3 setup, 4 per iteration for 8, then HALT', () => {
    expect(run.cycles).toBe(36);
  });
});

describe('programs as pictures', () => {
  test('the example draws a blue top row and nothing else', () => {
    expect(draw(BLUE_TOP_ROW)).toEqual([
      'BBBBBBBB',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
    ]);
  });

  test('a nested loop fills the whole screen red', () => {
    const source = [
      '      LOAD R0, 0',
      '      LOAD R1, 64',
      '      LOAD R2, RED',
      'loop: STORE R2, [R0]',
      '      ADDI R0, 1',
      '      SUBI R1, 1',
      '      JNZ R1, loop',
      '      HALT',
    ].join('\n');

    expect(draw(source)).toEqual(Array(8).fill('RRRRRRRR'));
  });
});
