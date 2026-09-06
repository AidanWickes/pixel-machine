import { describe, expect, test } from 'vitest';
import { countBlocks, parseBlocks } from '../src/lib/machine/blocks.js';

const blocksOf = (source: string) => {
  const result = parseBlocks(source);
  if (!result.ok) throw new Error(JSON.stringify(result.errors, null, 2));
  return result.blocks;
};

describe('parseBlocks', () => {
  test('parses the four simple commands', () => {
    expect(blocksOf('FILL 3\nSKIP 2\nROW\nPEN R')).toMatchObject([
      { kind: 'fill', count: 3 },
      { kind: 'skip', count: 2 },
      { kind: 'row' },
      { kind: 'pen', colour: 2 },
    ]);
  });

  test('parses REPEAT with a bracketed body', () => {
    expect(blocksOf('REPEAT 4 [ FILL 1 SKIP 1 ]')).toMatchObject([
      {
        kind: 'repeat',
        count: 4,
        body: [
          { kind: 'fill', count: 1 },
          { kind: 'skip', count: 1 },
        ],
      },
    ]);
  });

  test('parses nested REPEAT', () => {
    expect(blocksOf('REPEAT 2 [ REPEAT 3 [ ROW ] ]')).toMatchObject([
      {
        kind: 'repeat',
        count: 2,
        body: [{ kind: 'repeat', count: 3, body: [{ kind: 'row' }] }],
      },
    ]);
  });

  test('ignores comments and is case-insensitive', () => {
    expect(blocksOf('; a note\nfill 2 ; another')).toMatchObject([
      { kind: 'fill', count: 2 },
    ]);
  });
});

describe('parseBlocks errors', () => {
  const errorsOf = (source: string) => {
    const result = parseBlocks(source);
    if (result.ok) throw new Error('expected a parse error');
    return result.errors;
  };

  test('rejects an unknown command', () => {
    expect(errorsOf('WIGGLE 3')[0]).toEqual({
      message: "unknown command 'WIGGLE'",
      line: 1,
      col: 1,
    });
  });

  test('rejects FILL without a number', () => {
    expect(errorsOf('FILL')[0]?.message).toMatch(/FILL needs a number/);
  });

  test('rejects a number above 255', () => {
    expect(errorsOf('SKIP 300')[0]?.message).toMatch(/0-255/);
  });

  test('rejects an unknown pen colour', () => {
    expect(errorsOf('PEN GREEN')[0]?.message).toMatch(/B, R or Y/);
  });

  test('rejects REPEAT without a body', () => {
    expect(errorsOf('REPEAT 3 FILL 1')[0]?.message).toMatch(/needs a '\['/);
  });

  test('rejects an unclosed REPEAT', () => {
    expect(errorsOf('REPEAT 3 [ FILL 1')[0]?.message).toMatch(/missing '\]'/);
  });

  test('rejects a stray closing bracket', () => {
    expect(errorsOf('FILL 1 ]')[0]?.message).toMatch(/unexpected '\]'/);
  });
});

describe('countBlocks', () => {
  const count = (source: string) => countBlocks(blocksOf(source));

  test('counts each command the learner wrote', () => {
    expect(count('FILL 3')).toBe(1);
    expect(count('FILL 4 ROW SKIP 4 FILL 4')).toBe(4);
  });

  test('counts REPEAT itself, plus the commands in its body', () => {
    expect(count('REPEAT 4 [ FILL 8 ROW ]')).toBe(3);
  });

  test('counts nested REPEAT bodies too', () => {
    expect(count('REPEAT 2 [ REPEAT 3 [ ROW ] ]')).toBe(3);
  });
});
