import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { LESSONS, type Lesson } from '../src/lib/content/lessons.js';
import { score } from '../src/lib/score.js';
import { countBlocks, parseBlocks } from '../src/lib/machine/blocks.js';
import { runBlocks } from '../src/lib/machine/generate.js';
import { parse } from '../src/lib/machine/parse.js';
import { gridToRows, run } from './helpers.js';

/**
 * Runs a lesson's reference solution in whichever language it is written in.
 * `commands` is what the learner types — Blocks commands, or assembly
 * instructions — which is what par measures and what the score is based on.
 */
function reference(lesson: Lesson): { rows: string[]; commands: number } {
  if (lesson.language === 'blocks') {
    const parsed = parseBlocks(lesson.solution);
    if (!parsed.ok) throw new Error(`${lesson.id}: solution does not parse`);
    const result = runBlocks(lesson.solution);
    if (!result) throw new Error(`${lesson.id}: solution does not compile`);
    return { rows: gridToRows(result.grid), commands: countBlocks(parsed.blocks) };
  }

  const parsed = parse(lesson.solution);
  if (!parsed.ok) throw new Error(`${lesson.id}: solution does not parse`);
  const result = run(lesson.solution);
  if (result.fault) throw new Error(`${lesson.id}: ${result.fault.message}`);
  return { rows: gridToRows(result.grid), commands: parsed.instructions.length };
}

/** The mnemonics a solution actually uses, ignoring labels and comments. */
function mnemonicsUsed(source: string): Set<string> {
  return new Set(
    source
      .split('\n')
      .map((line) => line.replace(/;.*/, '').trim().replace(/^\w+:\s*/, ''))
      .map((line) => line.split(/[\s,]/)[0]?.toUpperCase())
      .filter((word): word is string => Boolean(word)),
  );
}

describe('the curriculum', () => {
  test('has lessons with unique ids', () => {
    expect(LESSONS.length).toBeGreaterThan(0);
    expect(new Set(LESSONS.map((lesson) => lesson.id)).size).toBe(LESSONS.length);
  });

  test('every target is eight rows of eight valid cells', () => {
    for (const lesson of LESSONS) {
      expect(lesson.target, lesson.id).toHaveLength(8);
      for (const row of lesson.target) {
        expect(row, `${lesson.id}: '${row}'`).toMatch(/^[.BRY]{8}$/);
      }
    }
  });

  test('all Blocks lessons come before any assembly lesson', () => {
    const languages = LESSONS.map((lesson) => lesson.language);
    expect(languages.lastIndexOf('blocks')).toBeLessThan(languages.indexOf('assembly'));
  });

  test('every lesson starts the learner with something, not a blank page', () => {
    for (const lesson of LESSONS) {
      expect(lesson.starter.trim().length, lesson.id).toBeGreaterThan(0);
    }
  });
});

describe('every reference solution', () => {
  test.each(LESSONS)('$id draws its stated target', (lesson) => {
    expect(reference(lesson).rows).toEqual(lesson.target);
  });

  test.each(LESSONS)('$id uses exactly its stated par in commands', (lesson) => {
    expect(reference(lesson).commands).toBe(lesson.par);
  });

  test.each(LESSONS)('$id scores full marks against its own par', (lesson) => {
    expect(score(reference(lesson).commands, lesson.par)).toBe(100);
  });

  test.each(LESSONS.filter((lesson) => lesson.requires))(
    '$id uses the instructions it teaches',
    (lesson) => {
      const used = mnemonicsUsed(lesson.solution);
      for (const mnemonic of lesson.requires ?? []) {
        expect([...used], `${lesson.id} must use ${mnemonic}`).toContain(mnemonic);
      }
    },
  );
});

/**
 * Every opcode in docs/machine.md should be taught somewhere. A curriculum that
 * never reaches an instruction leaves a hole the learner falls into later.
 */
describe('curriculum coverage', () => {
  const doc = readFileSync(new URL('../docs/machine.md', import.meta.url), 'utf8');
  const mnemonics = [...doc.matchAll(/^\|\s*`0x[0-9a-fA-F]`\s*\|\s*`([A-Z]+)/gm)].map(
    ([, mnemonic]) => mnemonic!,
  );

  test('teaches every instruction in the set', () => {
    const taught = new Set<string>();
    for (const lesson of LESSONS.filter((lesson) => lesson.language === 'assembly')) {
      for (const mnemonic of mnemonicsUsed(lesson.solution)) taught.add(mnemonic);
    }

    expect(mnemonics.filter((mnemonic) => !taught.has(mnemonic))).toEqual([]);
  });
});
