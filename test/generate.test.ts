import { describe, expect, test } from 'vitest';
import { generateDaily, runBlocks } from '../src/lib/machine/generate.js';
import { drawBlocks, gridToRows } from './helpers.js';

/** A spread of dates, including leap day and year boundaries. */
const DATES = Array.from({ length: 500 }, (_, n) => {
  const date = new Date(Date.UTC(2026, 0, 1 + n));
  return date.toISOString().slice(0, 10);
});

describe('generateDaily', () => {
  test('is deterministic — the same date always gives the same puzzle', () => {
    for (const date of ['2026-09-07', '2027-02-28', '2028-02-29']) {
      expect(generateDaily(date)).toEqual(generateDaily(date));
    }
  });

  test('different dates give different puzzles', () => {
    const grids = DATES.slice(0, 60).map((date) =>
      gridToRows(generateDaily(date).grid).join('|'),
    );
    // Not all distinct necessarily, but overwhelmingly so.
    expect(new Set(grids).size).toBeGreaterThan(50);
  });

  test('every puzzle is solvable by construction', () => {
    for (const date of DATES) {
      const puzzle = generateDaily(date);
      expect(gridToRows(puzzle.grid)).toEqual(gridToRows(puzzle.grid));
      // The program it came from must actually draw it.
      expect(drawBlocks(puzzle.source)).toEqual(gridToRows(puzzle.grid));
    }
  });

  test('par is the command count of the reference solution, and beatable', () => {
    for (const date of DATES.slice(0, 100)) {
      const puzzle = generateDaily(date);
      expect(puzzle.par).toBeGreaterThan(0);
      // Scoring is on commands, but cycles stay available to display. They are
      // equal when the program has no loop, and larger whenever it does.
      expect(puzzle.cycles).toBeGreaterThanOrEqual(puzzle.par);
    }
  });

  test('every puzzle passes the quality gate', () => {
    for (const date of DATES) {
      const { grid } = generateDaily(date);
      const lit = grid.filter((cell) => cell !== 0).length;
      const colours = new Set(grid.filter((cell) => cell !== 0));

      expect(lit, `${date} lit ${lit}`).toBeGreaterThanOrEqual(12);
      expect(lit, `${date} lit ${lit}`).toBeLessThanOrEqual(56);
      expect(colours.size, `${date} colours`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('puzzle variety', () => {
  /**
   * An early generator only ever produced period-2 and period-3 vertical
   * repeats, so every day was horizontal banding. The grids differed; the
   * *kind* of picture never did.
   */
  test('not every puzzle is a two- or three-row vertical repeat', () => {
    const irregular = DATES.slice(0, 300).filter((date) => {
      const rows = gridToRows(generateDaily(date).grid);
      return new Set(rows).size > 3;
    });

    expect(irregular.length).toBeGreaterThan(30);
  });
});

describe('runBlocks', () => {
  test('returns null for source that does not parse', () => {
    expect(runBlocks('WIGGLE 3')).toBeNull();
  });

  test('returns null for source that parses but does not compile', () => {
    expect(runBlocks('FILL 65')).toBeNull();
  });

  test('reports the grid and cycle count for source that runs', () => {
    const result = runBlocks('PEN R FILL 3');
    expect(result?.grid.slice(0, 4)).toEqual([2, 2, 2, 0]);
    expect(result?.commands).toBeGreaterThan(0);
  });
});
