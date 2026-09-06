import { describe, expect, test } from 'vitest';
import { assemble } from '../src/lib/machine/assemble.js';
import { MAX_CYCLES, execute } from '../src/lib/machine/execute.js';
import { parse } from '../src/lib/machine/parse.js';

const run = (source: string) => {
  const result = parse(source);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return execute(assemble(result.instructions));
};

describe('faults', () => {
  // Regression: the original build shipped a REPEAT 99999 [ ROW ] that froze
  // the tab on every keystroke. A runaway program must be impossible to write.
  test('a runaway loop stops at the cycle cap instead of hanging', () => {
    const result = run('loop: JMP loop');
    expect(result.fault?.message).toMatch(/cycles/);
    expect(result.cycles).toBe(MAX_CYCLES);
  });

  test('STORE past the last cell faults instead of writing off-screen', () => {
    const result = run('LOAD R0, 64\nLOAD R2, 1\nSTORE R2, [R0]\nHALT');
    expect(result.fault?.message).toMatch(/address 64/);
    expect(result.fault?.at).toBe(2);
  });

  test('STORE of a value above 3 faults rather than painting nonsense', () => {
    const result = run('LOAD R0, 0\nLOAD R2, 9\nSTORE R2, [R0]\nHALT');
    expect(result.fault?.message).toMatch(/colours are 0-3/);
  });
});
