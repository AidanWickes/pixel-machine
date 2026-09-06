import { describe, expect, test } from 'vitest';
import { score } from '../src/lib/score.js';

describe('score', () => {
  test('matching par is full marks', () => {
    expect(score(8, 8)).toBe(100);
  });

  test('twice as many commands as par is half marks', () => {
    expect(score(16, 8)).toBe(50);
  });

  test('four times par is a quarter', () => {
    expect(score(32, 8)).toBe(25);
  });

  test('beating par still caps at 100', () => {
    expect(score(4, 8)).toBe(100);
    expect(score(1, 8)).toBe(100);
  });

  test('rounds to a whole number', () => {
    expect(score(3, 2)).toBe(67);
    expect(Number.isInteger(score(7, 5))).toBe(true);
  });

  test('a solution with no commands scores nothing', () => {
    expect(score(0, 8)).toBe(0);
  });

  test('never returns a negative score', () => {
    expect(score(1000, 8)).toBeGreaterThanOrEqual(0);
  });
});
