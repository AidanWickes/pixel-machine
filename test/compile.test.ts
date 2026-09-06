import { describe, expect, test } from 'vitest';
import { compileBlocks, drawBlocks } from './helpers.js';

describe('compiling Blocks', () => {
  test('FILL paints from the cursor and moves it along', () => {
    expect(drawBlocks('FILL 8')).toEqual([
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

  test('SKIP moves without painting', () => {
    expect(drawBlocks('SKIP 2 FILL 2')[0]).toBe('..BB....');
  });

  test('PEN changes the colour of later fills', () => {
    expect(drawBlocks('FILL 2 PEN R FILL 2 PEN Y FILL 2')[0]).toBe('BBRRYY..');
  });

  test('ROW always moves down one row, even from a row start', () => {
    expect(drawBlocks('FILL 8 ROW FILL 8').slice(0, 3)).toEqual([
      'BBBBBBBB',
      '........',
      'BBBBBBBB',
    ]);
  });

  test('REPEAT draws stripes — the original workshop target', () => {
    expect(drawBlocks('REPEAT 4 [ FILL 8 ROW ]')).toEqual([
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

  test('REPEAT bodies can interleave fills and skips', () => {
    expect(drawBlocks('REPEAT 8 [ FILL 1 SKIP 1 ]').slice(0, 2)).toEqual([
      'B.B.B.B.',
      'B.B.B.B.',
    ]);
  });

  test('nested REPEAT works to two levels', () => {
    expect(drawBlocks('REPEAT 2 [ REPEAT 4 [ FILL 1 SKIP 1 ] ]').slice(0, 2)).toEqual([
      'B.B.B.B.',
      'B.B.B.B.',
    ]);
  });

  test('REPEAT 0 emits nothing rather than looping 256 times', () => {
    expect(drawBlocks('REPEAT 0 [ FILL 8 ] FILL 2')[0]).toBe('BB......');
  });
});

describe('what the compiler emits', () => {
  const opsOf = (source: string) => {
    const result = compileBlocks(source);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    return result.instructions.map((instruction) => instruction.op);
  };

  test('REPEAT becomes a real JNZ loop — the reveal the lessons build to', () => {
    expect(opsOf('REPEAT 4 [ FILL 1 ]')).toContain(0xa);
  });

  test('FILL unrolls, so the only loop in the output came from REPEAT', () => {
    expect(opsOf('FILL 4')).not.toContain(0xa);
  });

  test('ROW compiles to a single immediate add', () => {
    const result = compileBlocks('SKIP 3 ROW');
    if (!result.ok) throw new Error('expected success');
    const adds = result.instructions.filter((i) => i.op === 0x5);
    expect(adds.at(-1)).toMatchObject({ op: 0x5, rd: 0, imm: 5 });
  });
});

describe('compile errors', () => {
  const errorsOf = (source: string) => {
    const result = compileBlocks(source);
    if (result.ok) throw new Error('expected a compile error');
    return result.errors;
  };

  test('rejects a FILL that would paint past the end of the screen', () => {
    expect(errorsOf('FILL 65')[0]?.message).toMatch(/FILL runs past the end/);
  });

  test('rejects a cursor moved past the end of the screen', () => {
    expect(errorsOf('SKIP 60 ROW ROW')[0]?.message).toMatch(/this draws past the end/);
  });

  test('rejects ROW in a REPEAT whose body does not land on a row boundary', () => {
    expect(errorsOf('REPEAT 3 [ FILL 2 ROW SKIP 1 ]')[0]?.message).toMatch(
      /different distance/,
    );
  });

  test('rejects REPEAT nested deeper than the registers allow', () => {
    expect(errorsOf('REPEAT 2 [ REPEAT 2 [ REPEAT 2 [ FILL 1 ] ] ]')[0]?.message).toMatch(
      /nested too deeply/,
    );
  });
});
