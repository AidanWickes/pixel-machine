import { decode } from './assemble.js';

export const GRID_SIZE = 8;
export const CELLS = GRID_SIZE * GRID_SIZE;
export const MAX_CYCLES = 100_000;
/**
 * Recording is capped well below MAX_CYCLES so a runaway program cannot
 * allocate a snapshot per cycle. Teaching programs run to tens or low
 * hundreds of cycles, so the transport never notices the ceiling.
 */
export const MAX_FRAMES = 2_000;

export interface Fault {
  message: string;
  /** Instruction index that faulted. */
  at: number;
}

/** One executed instruction, recorded after its effect. */
export interface Frame {
  cycle: number;
  /** Index of the instruction that ran. */
  pc: number;
  registers: number[];
  /** Present only when this instruction painted a cell. */
  write?: { address: number; colour: number };
}

export interface ExecOptions {
  /**
   * Record a frame per instruction, for the editor's transport. Off by
   * default: server-side verification needs only the final grid and the
   * cycle count, and should not pay to record a replay nobody watches.
   */
  frames?: boolean;
}

export interface ExecResult {
  grid: number[];
  registers: number[];
  cycles: number;
  fault?: Fault;
  frames?: Frame[];
}

/**
 * Runs encoded words on the Pixel Machine. See docs/machine.md §1.
 *
 * Faults are returned, never thrown — a runaway program must be impossible
 * to write, because this runs on every keystroke in the editor.
 */
export function execute(words: number[], options?: ExecOptions): ExecResult {
  const grid = new Array<number>(CELLS).fill(0);
  const registers = [0, 0, 0, 0];
  const frames: Frame[] | undefined = options?.frames ? [] : undefined;
  let pc = 0;
  let cycles = 0;

  const record = (at: number, write?: Frame['write']) => {
    if (!frames || frames.length >= MAX_FRAMES) return;
    frames.push({
      cycle: cycles,
      pc: at,
      registers: [...registers],
      ...(write ? { write } : {}),
    });
  };

  const fault = (message: string, at: number): ExecResult => ({
    grid,
    registers,
    cycles,
    fault: { message, at },
    ...(frames ? { frames } : {}),
  });

  for (;;) {
    if (cycles >= MAX_CYCLES) {
      return fault(`program ran for more than ${MAX_CYCLES} cycles`, pc);
    }

    // Memory past the last instruction reads as 0x0000, which is HALT.
    const { op, rd, rs, imm } = decode(words[pc] ?? 0);
    const at = pc;
    pc += 1;
    cycles += 1;

    switch (op) {
      case 0x0:
        record(at);
        return { grid, registers, cycles, ...(frames ? { frames } : {}) };
      case 0x1:
        registers[rd] = imm;
        break;
      case 0x2: {
        const address = registers[rs]!;
        if (address >= CELLS) {
          return fault(
            `LOADI from address ${address}, but the screen ends at ${CELLS - 1}`,
            at,
          );
        }
        registers[rd] = grid[address]!;
        break;
      }
      case 0x3:
        registers[rd] = registers[rs]!;
        break;
      case 0x4:
        registers[rd] = (registers[rd]! + registers[rs]!) & 0xff;
        break;
      case 0x5:
        registers[rd] = (registers[rd]! + imm) & 0xff;
        break;
      case 0x6:
        registers[rd] = (registers[rd]! - registers[rs]!) & 0xff;
        break;
      case 0x7:
        registers[rd] = (registers[rd]! - imm) & 0xff;
        break;
      case 0x8: {
        const address = registers[rd]!;
        const colour = registers[rs]!;
        if (address >= CELLS) {
          return fault(
            `STORE to address ${address}, but the screen ends at ${CELLS - 1}`,
            at,
          );
        }
        if (colour > 3) {
          return fault(`STORE of colour ${colour}, but colours are 0-3`, at);
        }
        grid[address] = colour;
        record(at, { address, colour });
        continue;
      }
      case 0x9:
        pc = imm;
        break;
      case 0xa:
        if (registers[rs] !== 0) pc = imm;
        break;
      case 0xb:
        if (registers[rs] === 0) pc = imm;
        break;
      default:
        return fault(`unknown opcode 0x${op.toString(16)}`, at);
    }

    record(at);
  }
}
