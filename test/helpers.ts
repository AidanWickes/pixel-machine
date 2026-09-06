import { assemble } from '../src/lib/machine/assemble.js';
import {
  execute,
  type ExecOptions,
  type ExecResult,
} from '../src/lib/machine/execute.js';
import { parse } from '../src/lib/machine/parse.js';
import { parseBlocks } from '../src/lib/machine/blocks.js';
import { compile } from '../src/lib/machine/compile.js';

const INK: Record<string, number> = { '.': 0, B: 1, R: 2, Y: 3 };
const CHAR = ['.', 'B', 'R', 'Y'];

/**
 * Builds a grid from eight eight-character rows, so a test states the picture
 * it expects instead of a 64-element array of digits.
 *
 *   gridFrom(['BBBBBBBB', '........', ...])
 */
export function gridFrom(rows: string[]): number[] {
  if (rows.length !== 8) {
    throw new Error(`expected 8 rows, got ${rows.length}`);
  }
  return rows.flatMap((row, y) => {
    if (row.length !== 8) {
      throw new Error(`row ${y} has ${row.length} cells, expected 8`);
    }
    return [...row].map((char, x) => {
      const value = INK[char];
      if (value === undefined) {
        throw new Error(`unknown ink '${char}' at row ${y}, column ${x}`);
      }
      return value;
    });
  });
}

/** Renders a grid back to rows, so failure diffs are legible. */
export function gridToRows(grid: number[]): string[] {
  const rows: string[] = [];
  for (let y = 0; y < 8; y++) {
    rows.push(
      grid
        .slice(y * 8, y * 8 + 8)
        .map((cell) => CHAR[cell] ?? '?')
        .join(''),
    );
  }
  return rows;
}

/** Parses, assembles and runs assembly source. Throws on a parse error. */
export function run(source: string, options?: ExecOptions): ExecResult {
  const result = parse(source);
  if (!result.ok) {
    throw new Error(`parse failed:\n${JSON.stringify(result.errors, null, 2)}`);
  }
  return execute(assemble(result.instructions), options);
}

/** The picture a program draws, as rows — the form assertions should use. */
export function draw(source: string): string[] {
  return gridToRows(run(source).grid);
}

/** Parses Blocks source and compiles it, returning the compile result. */
export function compileBlocks(source: string) {
  const parsed = parseBlocks(source);
  if (!parsed.ok) {
    throw new Error(`Blocks parse failed:\n${JSON.stringify(parsed.errors, null, 2)}`);
  }
  return compile(parsed.blocks);
}

/** The picture a Blocks program draws, as rows. */
export function drawBlocks(source: string): string[] {
  const compiled = compileBlocks(source);
  if (!compiled.ok) {
    throw new Error(`compile failed:\n${JSON.stringify(compiled.errors, null, 2)}`);
  }
  return gridToRows(execute(assemble(compiled.instructions)).grid);
}
