import { describe, expect, test } from 'vitest';
import { run } from './helpers.js';

describe('execute', () => {
  test('LOAD sets a register and every instruction costs one cycle', () => {
    const result = run('LOAD R0, 5\nHALT');
    expect(result.registers).toEqual([5, 0, 0, 0]);
    expect(result.cycles).toBe(2);
    expect(result.fault).toBeUndefined();
  });

  test('STORE paints the addressed cell and leaves the rest off', () => {
    const result = run('LOAD R0, 9\nLOAD R2, 1\nSTORE R2, [R0]\nHALT');
    expect(result.grid[9]).toBe(1);
    expect(result.grid.filter((cell) => cell !== 0)).toHaveLength(1);
    expect(result.grid).toHaveLength(64);
  });
});

describe('register operations', () => {
  test('MOV copies one register into another', () => {
    expect(run('LOAD R1, 7\nMOV R0, R1\nHALT').registers).toEqual([7, 7, 0, 0]);
  });

  test('ADD wraps at 256 rather than saturating', () => {
    const result = run('LOAD R0, 200\nLOAD R1, 100\nADD R0, R1\nHALT');
    expect(result.registers[0]).toBe(44);
  });

  test('SUB wraps below zero rather than going negative', () => {
    const result = run('LOAD R0, 5\nLOAD R1, 10\nSUB R0, R1\nHALT');
    expect(result.registers[0]).toBe(251);
  });

  test('LOADI reads a painted cell back off the screen', () => {
    const result = run(
      'LOAD R0, 3\nLOAD R2, 2\nSTORE R2, [R0]\nLOADI R1, [R0]\nHALT',
    );
    expect(result.registers[1]).toBe(2);
  });

  test('LOADI past the last cell faults', () => {
    const result = run('LOAD R0, 64\nLOADI R1, [R0]\nHALT');
    expect(result.fault?.message).toMatch(/address 64/);
  });
});
