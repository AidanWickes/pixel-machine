import { assemble } from './assemble.js';
import { parseBlocks } from './blocks.js';
import { compile } from './compile.js';
import { execute } from './execute.js';

export interface DailyPuzzle {
  grid: number[];
  /** Cycles the generating program took. An upper bound, not a proven optimum. */
  par: number;
  seed: number;
  /** The generating Blocks program. Server-side only — never send this out. */
  source: string;
}

const WIDTH = 8;
const ROWS = 8;
const COLOURS = ['B', 'R', 'Y'];
const MIN_LIT = 12;
const MAX_LIT = 56;
const MIN_COLOURS = 2;
const MAX_ATTEMPTS = 50;

/** djb2. Turns a date string into a seed. */
function hash(text: string): number {
  let value = 5381;
  for (let i = 0; i < text.length; i++) {
    value = (Math.imul(value, 33) ^ text.charCodeAt(i)) | 0;
  }
  return value >>> 0;
}

/** mulberry32 — small, fast, and deterministic. No dependency needed. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Run {
  fill: boolean;
  length: number;
}

/** A row of runs summing to exactly 8, so the cursor lands on the next row. */
function rowPattern(rand: () => number): Run[] {
  const runs: Run[] = [];
  let remaining = WIDTH;
  let fill = rand() < 0.6;

  while (remaining > 0) {
    const length = 1 + Math.floor(rand() * Math.min(4, remaining));
    runs.push({ fill, length });
    remaining -= length;
    fill = !fill;
  }

  // A row of pure SKIP paints nothing and cannot carry a colour.
  if (!runs.some((run) => run.fill)) runs[0]!.fill = true;
  return runs;
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

/**
 * Builds a Blocks program from periodic row patterns, so REPEAT compresses it
 * naturally and par is a reasonable reference rather than straight-line code.
 */
function buildSource(rand: () => number): string {
  // Period is how many rows pass before the picture repeats. Small periods are
  // banded and compress well; period 8 gives every row its own pattern and no
  // REPEAT at all. Mixing them is what stops every day looking alike.
  const period = pick(rand, [2, 2, 3, 3, 4, 4, 8]);

  const palette = [...COLOURS].sort(() => rand() - 0.5).slice(0, rand() < 0.5 ? 2 : 3);
  // Chosen per pattern with repeats allowed, so period can exceed the palette.
  const colours = Array.from({ length: period }, () => pick(rand, palette));

  const emitRow = (index: number, patterns: Run[][]): string =>
    [
      `PEN ${colours[index]!}`,
      ...patterns[index]!.map((run) => `${run.fill ? 'FILL' : 'SKIP'} ${run.length}`),
    ].join(' ');

  const patterns = Array.from({ length: period }, () => rowPattern(rand));
  const cycles = Math.floor(ROWS / period);
  const remainder = ROWS % period;

  const body = Array.from({ length: period }, (_, i) => emitRow(i, patterns)).join('\n  ');
  const tail = Array.from({ length: remainder }, (_, i) => emitRow(i, patterns));

  // A single pass needs no loop around it.
  const head = cycles > 1 ? `REPEAT ${cycles} [\n  ${body}\n]` : body;
  return [head, ...tail].join('\n');
}

/**
 * Runs Blocks source and reports what it drew. Returns null if the source does
 * not parse, does not compile, or faults — which for generated programs would
 * mean a generator bug, but the function is public because running Blocks and
 * getting a grid back is useful on its own.
 */
export function runBlocks(source: string): { grid: number[]; par: number } | null {
  const parsed = parseBlocks(source);
  if (!parsed.ok) return null;
  const compiled = compile(parsed.blocks);
  if (!compiled.ok) return null;

  const result = execute(assemble(compiled.instructions));
  if (result.fault) return null;
  return { grid: result.grid, par: result.cycles };
}

function passesGate(grid: number[]): boolean {
  const lit = grid.filter((cell) => cell !== 0).length;
  if (lit < MIN_LIT || lit > MAX_LIT) return false;
  return new Set(grid.filter((cell) => cell !== 0)).size >= MIN_COLOURS;
}

/**
 * The day's puzzle, derived from its date alone. Pure and deterministic, so the
 * browser and the server compute the identical puzzle with no coordination and
 * nothing stored. See docs/machine.md §8.
 *
 * Generated backwards: build a random program, run it, and whatever it draws is
 * the puzzle. Solvable by construction — no solver search anywhere.
 */
export function generateDaily(dateISO: string): DailyPuzzle {
  const base = hash(dateISO);
  let last: DailyPuzzle | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const seed = (base + attempt * 0x9e3779b9) >>> 0;
    const source = buildSource(random(seed));
    const drawn = runBlocks(source);
    if (!drawn) continue;

    const puzzle = { grid: drawn.grid, par: drawn.par, seed, source };
    last = puzzle;
    if (passesGate(drawn.grid)) return puzzle;
  }

  // Every attempt was rejected by the gate. Better a dull puzzle than none —
  // the gate is a preference, not a correctness requirement. MAX_ATTEMPTS is
  // greater than zero, so at least one attempt always landed here.
  return last!;
}
