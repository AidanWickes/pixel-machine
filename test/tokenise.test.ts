import { describe, expect, test } from 'vitest';
import { tokenise } from '../src/lib/machine/tokenise.js';

describe('tokenise', () => {
  test('splits an instruction into positioned tokens', () => {
    expect(tokenise('LOAD R0, 5')).toEqual([
      { text: 'LOAD', line: 1, col: 1 },
      { text: 'R0', line: 1, col: 6 },
      { text: '5', line: 1, col: 10 },
    ]);
  });
});

describe('tokenise comments', () => {
  test('discards comments but keeps line numbering', () => {
    const source = '; a header comment\nLOAD R0, 0 ; trailing comment';
    expect(tokenise(source)).toEqual([
      { text: 'LOAD', line: 2, col: 1 },
      { text: 'R0', line: 2, col: 6 },
      { text: '0', line: 2, col: 10 },
    ]);
  });
});

describe('tokenise brackets', () => {
  test('emits brackets as their own tokens', () => {
    expect(tokenise('STORE R2, [R0]')).toEqual([
      { text: 'STORE', line: 1, col: 1 },
      { text: 'R2', line: 1, col: 7 },
      { text: '[', line: 1, col: 11 },
      { text: 'R0', line: 1, col: 12 },
      { text: ']', line: 1, col: 14 },
    ]);
  });
});
