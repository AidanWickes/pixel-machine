import { describe, expect, test } from 'vitest';
import { MAX_CYCLES, MAX_FRAMES } from '../src/lib/machine/execute.js';
import { run } from './helpers.js';

const BLUE_TOP_ROW = [
  'LOAD R0, 0',
  'LOAD R1, 8',
  'LOAD R2, BLUE',
  'loop: STORE R2, [R0]',
  'ADDI R0, 1',
  'SUBI R1, 1',
  'JNZ R1, loop',
  'HALT',
].join('\n');

describe('replay frames', () => {
  test('are not recorded unless asked for, so verification stays lean', () => {
    expect(run(BLUE_TOP_ROW).frames).toBeUndefined();
  });

  test('record one frame per executed instruction', () => {
    const result = run(BLUE_TOP_ROW, { frames: true });
    expect(result.frames).toHaveLength(result.cycles);
    expect(result.cycles).toBe(36);
  });

  test('a frame names the instruction that ran and the state after it', () => {
    const result = run('LOAD R0, 3\nLOAD R2, 1\nSTORE R2, [R0]\nHALT', {
      frames: true,
    });
    expect(result.frames?.[0]).toEqual({
      cycle: 1,
      pc: 0,
      registers: [3, 0, 0, 0],
    });
  });

  test('a painting instruction records the cell it wrote', () => {
    const result = run('LOAD R0, 3\nLOAD R2, 1\nSTORE R2, [R0]\nHALT', {
      frames: true,
    });
    expect(result.frames?.[2]).toEqual({
      cycle: 3,
      pc: 2,
      registers: [3, 0, 1, 0],
      write: { address: 3, colour: 1 },
    });
  });

  test('a runaway program caps frames well below the cycle cap', () => {
    const result = run('loop: JMP loop', { frames: true });
    expect(result.cycles).toBe(MAX_CYCLES);
    expect(result.frames).toHaveLength(MAX_FRAMES);
    expect(MAX_FRAMES).toBeLessThan(MAX_CYCLES);
  });
});
