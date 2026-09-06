#!/usr/bin/env tsx
/**
 * Runs a Pixel Machine program and prints what it draws.
 *
 *   npm run draw -- examples/top-row.asm
 *   npm run draw -- -e "LOAD R2, BLUE
 *                       STORE R2, [R0]
 *                       HALT"
 */
import { readFileSync } from 'node:fs';
import { assemble } from '../src/lib/machine/assemble.js';
import { execute } from '../src/lib/machine/execute.js';
import { parse } from '../src/lib/machine/parse.js';

const INK = ['· ', '██', '▓▓', '▒▒'];

function render(grid: number[]): string {
  const rows: string[] = [];
  for (let y = 0; y < 8; y++) {
    const cells = grid.slice(y * 8, y * 8 + 8).map((cell) => INK[cell] ?? '??');
    rows.push(`  ${cells.join('')}`);
  }
  return rows.join('\n');
}

function main(argv: string[]): number {
  const [flag, value] = argv;

  if (!flag || flag === '--help' || flag === '-h') {
    console.log(
      [
        'Usage:',
        '  npm run draw -- <file.asm>     run a program from a file',
        '  npm run draw -- -e "<source>"  run a program given inline',
        '',
        'Instruction set: docs/machine.md',
      ].join('\n'),
    );
    return flag ? 0 : 1;
  }

  let source: string;
  try {
    source = flag === '-e' ? (value ?? '') : readFileSync(flag, 'utf8');
  } catch {
    console.error(`Cannot read '${flag}'`);
    return 1;
  }

  const parsed = parse(source);
  if (!parsed.ok) {
    console.error("Won't run:");
    for (const error of parsed.errors) {
      console.error(`  line ${error.line}, column ${error.col}: ${error.message}`);
    }
    return 1;
  }

  const result = execute(assemble(parsed.instructions));

  console.log();
  console.log(render(result.grid));
  console.log();

  if (result.fault) {
    console.log(`  fault at instruction ${result.fault.at}: ${result.fault.message}`);
  }

  console.log(`  ${result.cycles} cycles · ${parsed.instructions.length} instructions`);
  console.log(`  registers  ${result.registers.map((r, i) => `R${i}=${r}`).join('  ')}`);
  console.log();

  return result.fault ? 1 : 0;
}

process.exit(main(process.argv.slice(2)));
