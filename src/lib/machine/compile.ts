import type { Block } from './blocks.js';
import type { Instruction, ParseError } from './parse.js';

export type CompileResult =
  | { ok: true; instructions: Instruction[] }
  | { ok: false; errors: ParseError[] };

const CURSOR = 0;
const COLOUR = 2;
/** Loop counters, innermost last. Two registers means two levels of REPEAT. */
const COUNTERS = [1, 3];
const CELLS = 64;
const WIDTH = 8;
const DEFAULT_PEN = 1; // blue

const OP = {
  halt: 0x0,
  load: 0x1,
  addi: 0x5,
  subi: 0x7,
  store: 0x8,
  jnz: 0xa,
} as const;

/**
 * Compiles Blocks to instructions. See docs/machine.md §7.
 *
 * Two rules shape the output, and both are pedagogical rather than technical:
 *
 * 1. FILL unrolls to STORE/ADDI pairs. It is fewer cycles and fewer
 *    instructions than a counted loop, needs no counter register, and leaves
 *    REPEAT as the only thing in the output that produces a JNZ — which is
 *    exactly the reveal the lessons build towards.
 *
 * 2. The cursor is tracked here, at compile time. ROW must advance
 *    `8 - (pos mod 8)` cells, which would need a division the machine does not
 *    have; but every count in Blocks is a literal, so the position is always
 *    known and ROW becomes a single ADDI.
 */
export function compile(blocks: Block[]): CompileResult {
  const instructions: Instruction[] = [];
  const errors: ParseError[] = [];
  let pos = 0;

  const emit = (op: number, rd: number, rs: number, imm: number, line: number) =>
    instructions.push({ op, rd, rs, imm, line });

  const fail = (message: string, block: Block) =>
    errors.push({ message, line: block.line, col: block.col });

  const hasRow = (body: Block[]): boolean =>
    body.some(
      (block) =>
        block.kind === 'row' || (block.kind === 'repeat' && hasRow(block.body)),
    );

  const walk = (body: Block[], depth: number) => {
    for (const block of body) {
      if (errors.length > 0) return;

      switch (block.kind) {
        case 'pen':
          emit(OP.load, COLOUR, 0, block.colour, block.line);
          break;

        case 'skip':
          if (block.count > 0) emit(OP.addi, CURSOR, 0, block.count, block.line);
          pos += block.count;
          break;

        case 'fill': {
          if (pos + block.count > CELLS) {
            fail('FILL runs past the end of the screen', block);
            return;
          }
          for (let n = 0; n < block.count; n++) {
            emit(OP.store, CURSOR, COLOUR, 0, block.line);
            emit(OP.addi, CURSOR, 0, 1, block.line);
          }
          pos += block.count;
          break;
        }

        case 'row': {
          // Always moves down one row, even from a row start.
          const step = WIDTH - (pos % WIDTH);
          emit(OP.addi, CURSOR, 0, step, block.line);
          pos += step;
          break;
        }

        case 'repeat': {
          if (block.count === 0) break; // A counted-down loop would run 256 times.
          if (depth >= COUNTERS.length) {
            fail('REPEAT is nested too deeply — only two levels fit in registers', block);
            return;
          }

          const counter = COUNTERS[depth]!;
          const entry = pos;
          emit(OP.load, counter, 0, block.count, block.line);
          const start = instructions.length;

          walk(block.body, depth + 1);
          if (errors.length > 0) return;

          emit(OP.subi, counter, 0, 1, block.line);
          emit(OP.jnz, 0, counter, start, block.line);

          const step = pos - entry;
          // Each iteration starts 'step' further on, so the pen's column only
          // repeats when step is a whole number of rows. Otherwise ROW would
          // need to move a different distance on every pass.
          if (hasRow(block.body) && step % WIDTH !== 0) {
            fail(
              'ROW inside this REPEAT would move a different distance each time',
              block,
            );
            return;
          }
          pos = entry + step * block.count;
          break;
        }
      }

      if (pos > CELLS) {
        fail('this draws past the end of the screen', block);
        return;
      }
    }
  };

  emit(OP.load, CURSOR, 0, 0, 1);
  emit(OP.load, COLOUR, 0, DEFAULT_PEN, 1);
  walk(blocks, 0);
  emit(OP.halt, 0, 0, 0, blocks.at(-1)?.line ?? 1);

  return errors.length > 0 ? { ok: false, errors } : { ok: true, instructions };
}
