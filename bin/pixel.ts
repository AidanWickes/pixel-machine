#!/usr/bin/env tsx
/**
 * Runs a Pixel Machine program and prints what it draws.
 *
 *   npm run draw -- examples/top-row.asm
 *   npm run draw -- examples/stripes.blocks --asm
 *   npm run draw -- -e "LOAD R2, BLUE ..."     assembly, inline
 *   npm run draw -- -b "REPEAT 4 [ FILL 8 ROW ]"   Blocks, inline
 */
import { readFileSync } from 'node:fs';
import { assemble } from '../src/lib/machine/assemble.js';
import { parseBlocks } from '../src/lib/machine/blocks.js';
import { compile } from '../src/lib/machine/compile.js';
import { disassemble } from '../src/lib/machine/disassemble.js';
import { execute } from '../src/lib/machine/execute.js';
import { generateDaily } from '../src/lib/machine/generate.js';
import { parse, type Instruction, type ParseError } from '../src/lib/machine/parse.js';

const INK = ['· ', '██', '▓▓', '▒▒'];

const USAGE = [
  'Usage:',
  '  npm run draw -- <file.asm|file.blocks> [--asm]',
  '  npm run draw -- -e "<assembly source>" [--asm]',
  '  npm run draw -- -b "<blocks source>" [--asm]',
  '  npm run draw -- --daily [YYYY-MM-DD]',
  '',
  '  --asm   also print the assembly the program becomes',
  '',
  'Instruction set: docs/machine.md',
].join('\n');

function render(grid: number[]): string {
  const rows: string[] = [];
  for (let y = 0; y < 8; y++) {
    rows.push(`  ${grid.slice(y * 8, y * 8 + 8).map((c) => INK[c] ?? '??').join('')}`);
  }
  return rows.join('\n');
}

function report(stage: string, errors: ParseError[]): number {
  console.error(`Won't run — ${stage}:`);
  for (const error of errors) {
    console.error(`  line ${error.line}, column ${error.col}: ${error.message}`);
  }
  return 1;
}

/** Turns source into instructions, choosing the language. */
function build(source: string, blocks: boolean): Instruction[] | number {
  if (!blocks) {
    const parsed = parse(source);
    return parsed.ok ? parsed.instructions : report('parse error', parsed.errors);
  }

  const parsed = parseBlocks(source);
  if (!parsed.ok) return report('parse error', parsed.errors);

  const compiled = compile(parsed.blocks);
  return compiled.ok ? compiled.instructions : report('compile error', compiled.errors);
}

function daily(dateISO: string): number {
  const puzzle = generateDaily(dateISO);
  console.log();
  console.log(`  Daily puzzle — ${dateISO} (rolls at 00:00 UTC)`);
  console.log();
  console.log(render(puzzle.grid));
  console.log();
  console.log(`  reference solution: ${puzzle.par} cycles — beat it`);
  console.log();
  return 0;
}

function main(argv: string[]): number {
  const showAsm = argv.includes('--asm');
  const args = argv.filter((arg) => arg !== '--asm');
  const [first, second] = args;

  if (first === '--daily') {
    return daily(second ?? new Date().toISOString().slice(0, 10));
  }

  if (!first || first === '--help' || first === '-h') {
    console.log(USAGE);
    return first ? 0 : 1;
  }

  const inline = first === '-e' || first === '-b';
  let source: string;
  let blocks: boolean;

  if (inline) {
    source = second ?? '';
    blocks = first === '-b';
  } else {
    blocks = first.endsWith('.blocks');
    try {
      source = readFileSync(first, 'utf8');
    } catch {
      console.error(`Cannot read '${first}'`);
      return 1;
    }
  }

  const built = build(source, blocks);
  if (typeof built === 'number') return built;

  const result = execute(assemble(built));

  console.log();
  console.log(render(result.grid));
  console.log();

  if (showAsm) {
    console.log(blocks ? '  compiled to:' : '  assembly:');
    for (const line of disassemble(built)) console.log(`  ${line}`);
    console.log();
  }

  if (result.fault) {
    console.log(`  fault at instruction ${result.fault.at}: ${result.fault.message}`);
  }
  console.log(`  ${result.cycles} cycles · ${built.length} instructions`);
  console.log(`  registers  ${result.registers.map((r, i) => `R${i}=${r}`).join('  ')}`);
  console.log();

  return result.fault ? 1 : 0;
}

process.exit(main(process.argv.slice(2)));
