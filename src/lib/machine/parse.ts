import { tokenise, type Token } from './tokenise.js';

export interface Instruction {
  op: number;
  rd: number;
  rs: number;
  imm: number;
  line: number;
}

export interface ParseError {
  message: string;
  line: number;
  col: number;
}

export type ParseResult =
  | { ok: true; instructions: Instruction[] }
  | { ok: false; errors: ParseError[] };

/** Operand shapes. See docs/machine.md §2. */
export type Form =
  | 'none'
  | 'reg,imm'
  | 'reg,reg'
  | 'loadi'
  | 'store'
  | 'reg,target'
  | 'target';

export const OPCODES: Record<string, { op: number; form: Form }> = {
  HALT: { op: 0x0, form: 'none' },
  LOAD: { op: 0x1, form: 'reg,imm' },
  LOADI: { op: 0x2, form: 'loadi' },
  MOV: { op: 0x3, form: 'reg,reg' },
  ADD: { op: 0x4, form: 'reg,reg' },
  ADDI: { op: 0x5, form: 'reg,imm' },
  SUB: { op: 0x6, form: 'reg,reg' },
  SUBI: { op: 0x7, form: 'reg,imm' },
  STORE: { op: 0x8, form: 'store' },
  JMP: { op: 0x9, form: 'target' },
  JNZ: { op: 0xa, form: 'reg,target' },
  JZ: { op: 0xb, form: 'reg,target' },
};

/** Assembler constants for the four cell values. See docs/machine.md §4. */
const CONSTANTS: Record<string, number> = {
  OFF: 0,
  BLUE: 1,
  RED: 2,
  YELLOW: 3,
};

export function parse(source: string): ParseResult {
  const tokens = tokenise(source);
  const instructions: Instruction[] = [];
  const errors: ParseError[] = [];
  const labels = new Map<string, number>();
  /** Jump targets cannot resolve until every label is known. */
  const unresolved: Array<{ index: number; token: Token }> = [];
  let i = 0;

  const fail = (message: string, at: Token | undefined) => {
    const last = tokens[tokens.length - 1];
    errors.push({
      message,
      line: at?.line ?? last?.line ?? 1,
      col: at?.col ?? last?.col ?? 1,
    });
  };

  const register = (token: Token | undefined): number | null => {
    if (!token || !/^R[0-3]$/i.test(token.text)) {
      fail('expected a register R0-R3', token);
      return null;
    }
    return Number(token.text.slice(1));
  };

  const immediate = (token: Token | undefined): number | null => {
    const constant = token && CONSTANTS[token.text.toUpperCase()];
    if (constant !== undefined) return constant;

    const isHex = token !== undefined && /^0x[0-9a-f]+$/i.test(token.text);
    if (!token || !(isHex || /^\d+$/.test(token.text))) {
      fail('expected a number', token);
      return null;
    }
    const value = isHex ? parseInt(token.text.slice(2), 16) : Number(token.text);
    if (value > 255) {
      fail('number must be 0-255', token);
      return null;
    }
    return value;
  };

  const bracketed = (): number | null => {
    const open = tokens[i++];
    if (open?.text !== '[') fail("expected '['", open);
    const reg = register(tokens[i++]);
    const close = tokens[i++];
    if (close?.text !== ']') fail("expected ']'", close);
    return reg;
  };

  /** Records a jump target for the second pass. Returns a placeholder. */
  const target = (token: Token | undefined): number | null => {
    if (!token) {
      fail('expected a jump target', token);
      return null;
    }
    if (/^\d+$/.test(token.text)) return immediate(token);
    unresolved.push({ index: instructions.length, token });
    return 0;
  };

  while (i < tokens.length) {
    const head = tokens[i++]!;

    if (head.text.endsWith(':')) {
      const name = head.text.slice(0, -1).toLowerCase();
      if (labels.has(name)) fail(`duplicate label '${name}'`, head);
      labels.set(name, instructions.length);
      continue;
    }

    const entry = OPCODES[head.text.toUpperCase()];
    if (!entry) {
      fail(`unknown instruction '${head.text}'`, head);
      // Recover at the next line. Without this the orphaned operands are read
      // as instructions too, so one typo reports three errors.
      while (i < tokens.length && tokens[i]!.line === head.line) i++;
      continue;
    }

    const emit = (rd: number, rs: number, imm: number) =>
      instructions.push({ op: entry.op, rd, rs, imm, line: head.line });

    switch (entry.form) {
      case 'none': {
        emit(0, 0, 0);
        break;
      }
      case 'reg,imm': {
        const rd = register(tokens[i++]);
        const imm = immediate(tokens[i++]);
        if (rd !== null && imm !== null) emit(rd, 0, imm);
        break;
      }
      case 'reg,reg': {
        const rd = register(tokens[i++]);
        const rs = register(tokens[i++]);
        if (rd !== null && rs !== null) emit(rd, rs, 0);
        break;
      }
      case 'loadi': {
        // LOADI Rd, [Rs] — destination first, address second.
        const rd = register(tokens[i++]);
        const rs = bracketed();
        if (rd !== null && rs !== null) emit(rd, rs, 0);
        break;
      }
      case 'store': {
        // STORE Rs, [Rd] — the value comes first, the address second.
        const rs = register(tokens[i++]);
        const rd = bracketed();
        if (rs !== null && rd !== null) emit(rd, rs, 0);
        break;
      }
      case 'target': {
        const imm = target(tokens[i++]);
        if (imm !== null) emit(0, 0, imm);
        break;
      }
      case 'reg,target': {
        const rs = register(tokens[i++]);
        const imm = target(tokens[i++]);
        if (rs !== null && imm !== null) emit(0, rs, imm);
        break;
      }
    }
  }

  for (const { index, token } of unresolved) {
    const at = labels.get(token.text.toLowerCase());
    if (at === undefined) {
      fail(`undefined label '${token.text}'`, token);
      continue;
    }
    instructions[index]!.imm = at;
  }

  if (instructions.length > 256) {
    fail('program is longer than 256 instructions', tokens[tokens.length - 1]);
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, instructions };
}
