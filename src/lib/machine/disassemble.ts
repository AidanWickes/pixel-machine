import { OPCODES, type Form, type Instruction } from './parse.js';

/** Opcode number back to its mnemonic and operand shape. */
const BY_OP = new Map<number, { mnemonic: string; form: Form }>(
  Object.entries(OPCODES).map(([mnemonic, { op, form }]) => [op, { mnemonic, form }]),
);

function operands(form: Form, { rd, rs, imm }: Instruction): string {
  switch (form) {
    case 'none':
      return '';
    case 'reg,imm':
      return `R${rd}, ${imm}`;
    case 'reg,reg':
      return `R${rd}, R${rs}`;
    case 'loadi':
      return `R${rd}, [R${rs}]`;
    case 'store':
      return `R${rs}, [R${rd}]`;
    case 'target':
      return `${imm}`;
    case 'reg,target':
      return `R${rs}, ${imm}`;
  }
}

/**
 * Renders instructions as assembly source. Used to show a learner what their
 * Blocks program became — the reveal the curriculum builds towards.
 *
 * Jump targets print as instruction indices rather than labels, which is what
 * the machine actually holds.
 */
export function disassemble(instructions: Instruction[]): string[] {
  return instructions.map((instruction, index) => {
    const entry = BY_OP.get(instruction.op);
    if (!entry) return `${String(index).padStart(3)}  ???`;
    const text = `${entry.mnemonic} ${operands(entry.form, instruction)}`.trim();
    return `${String(index).padStart(3)}  ${text}`;
  });
}
