import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { drawBlocks, gridToRows, run } from './helpers.js';

/**
 * The example programs are documentation. If one stops drawing what it claims
 * to draw, that is a broken doc, so they are held to their pictures here.
 */
const example = (name: string) =>
  readFileSync(new URL(`../examples/${name}`, import.meta.url), 'utf8');

describe('example programs', () => {
  test('top-row.asm draws a blue row across the top in 36 cycles', () => {
    const result = run(example('top-row.asm'));
    expect(gridToRows(result.grid)).toEqual([
      'BBBBBBBB',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
    ]);
    expect(result.cycles).toBe(36);
    expect(result.fault).toBeUndefined();
  });

  test('diagonal.asm steps one right and one down per cell', () => {
    const result = run(example('diagonal.asm'));
    expect(gridToRows(result.grid)).toEqual([
      'R.......',
      '.R......',
      '..R.....',
      '...R....',
      '....R...',
      '.....R..',
      '......R.',
      '.......R',
    ]);
    expect(result.fault).toBeUndefined();
  });

  test('border.asm draws a hollow yellow frame', () => {
    const result = run(example('border.asm'));
    expect(gridToRows(result.grid)).toEqual([
      'YYYYYYYY',
      'Y......Y',
      'Y......Y',
      'Y......Y',
      'Y......Y',
      'Y......Y',
      'Y......Y',
      'YYYYYYYY',
    ]);
    expect(result.fault).toBeUndefined();
  });

  test('stripes.blocks draws four stripes from four Blocks commands', () => {
    expect(drawBlocks(example('stripes.blocks'))).toEqual([
      'BBBBBBBB',
      '........',
      'BBBBBBBB',
      '........',
      'BBBBBBBB',
      '........',
      'BBBBBBBB',
      '........',
    ]);
  });

  test('checks.blocks draws a red chequerboard', () => {
    expect(drawBlocks(example('checks.blocks'))).toEqual([
      'R.R.R.R.',
      '.R.R.R.R',
      'R.R.R.R.',
      '.R.R.R.R',
      'R.R.R.R.',
      '.R.R.R.R',
      'R.R.R.R.',
      '.R.R.R.R',
    ]);
  });
});
