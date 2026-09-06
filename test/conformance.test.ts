import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { execute } from '../src/lib/machine/execute.js';
import { parse } from '../src/lib/machine/parse.js';

/**
 * docs/machine.md is normative. This suite reads its opcode table and holds
 * the implementation to it, so the document cannot quietly drift out of date.
 */
const doc = readFileSync(new URL('../docs/machine.md', import.meta.url), 'utf8');

const SPEC = [...doc.matchAll(/^\|\s*`0x([0-9a-fA-F])`\s*\|\s*`([A-Z]+)/gm)].map(
  ([, hex, mnemonic]) => ({ op: parseInt(hex!, 16), mnemonic: mnemonic! }),
);

/** One sample per mnemonic. A new opcode in the doc must add a line here. */
const SAMPLES: Record<string, string> = {
  HALT: 'HALT',
  LOAD: 'LOAD R0, 5',
  LOADI: 'LOADI R0, [R1]',
  MOV: 'MOV R0, R1',
  ADD: 'ADD R0, R1',
  ADDI: 'ADDI R0, 1',
  SUB: 'SUB R0, R1',
  SUBI: 'SUBI R0, 1',
  STORE: 'STORE R2, [R0]',
  JMP: 'JMP 0',
  JNZ: 'JNZ R1, 0',
  JZ: 'JZ R1, 0',
};

describe('conformance with docs/machine.md', () => {
  test('the opcode table was found and parsed', () => {
    expect(SPEC.length).toBeGreaterThanOrEqual(12);
  });

  test('every documented mnemonic has a sample program in this suite', () => {
    const missing = SPEC.filter(({ mnemonic }) => !SAMPLES[mnemonic]);
    expect(missing.map((entry) => entry.mnemonic)).toEqual([]);
  });

  test.each(SPEC)('$mnemonic (0x$op) is accepted by the parser', ({ mnemonic }) => {
    const sample = SAMPLES[mnemonic];
    if (!sample) return;
    const result = parse(sample);
    const messages = result.ok ? [] : result.errors.map((e) => e.message);
    expect(messages).toEqual([]);
  });

  test.each(SPEC)('$mnemonic (0x$op) is implemented by the executor', ({ op }) => {
    // Build the word directly, so this does not depend on the parser.
    const result = execute([op << 12]);
    expect(result.fault?.message ?? '').not.toMatch(/unknown opcode/);
  });
});
