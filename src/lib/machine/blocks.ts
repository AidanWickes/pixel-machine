import { tokenise, type Token } from './tokenise.js';
import type { ParseError } from './parse.js';

/**
 * The Blocks language from the original workshop. See docs/machine.md §7.
 *
 *   FILL n | SKIP n | ROW | PEN B|R|Y | REPEAT n [ ... ]
 */
/** Every block carries its source position, so compile errors can point at it. */
interface At {
  line: number;
  col: number;
}

export type Block =
  | ({ kind: 'fill'; count: number } & At)
  | ({ kind: 'skip'; count: number } & At)
  | ({ kind: 'row' } & At)
  | ({ kind: 'pen'; colour: number } & At)
  | ({ kind: 'repeat'; count: number; body: Block[] } & At);

export type BlocksResult =
  | { ok: true; blocks: Block[] }
  | { ok: false; errors: ParseError[] };

const PEN_COLOURS: Record<string, number> = { B: 1, R: 2, Y: 3 };

export function parseBlocks(source: string): BlocksResult {
  const tokens = tokenise(source);
  const errors: ParseError[] = [];
  let i = 0;

  const fail = (message: string, at: Token | undefined) => {
    const last = tokens[tokens.length - 1];
    errors.push({
      message,
      line: at?.line ?? last?.line ?? 1,
      col: at?.col ?? last?.col ?? 1,
    });
  };

  const count = (after: Token): number | null => {
    const token = tokens[i++];
    if (!token || !/^\d+$/.test(token.text)) {
      fail(`${after.text.toUpperCase()} needs a number`, token ?? after);
      return null;
    }
    const value = Number(token.text);
    if (value > 255) {
      fail('number must be 0-255', token);
      return null;
    }
    return value;
  };

  /** Reads blocks until `]` (when nested) or the end of the source. */
  const body = (nested: boolean): Block[] => {
    const blocks: Block[] = [];

    while (i < tokens.length) {
      const head = tokens[i++]!;
      const word = head.text.toUpperCase();

      if (word === ']') {
        if (nested) return blocks;
        fail("unexpected ']'", head);
        continue;
      }

      switch (word) {
        case 'ROW':
          blocks.push({ kind: 'row', line: head.line, col: head.col });
          break;
        case 'FILL':
        case 'SKIP': {
          const value = count(head);
          if (value !== null) {
            blocks.push({
              kind: word === 'FILL' ? 'fill' : 'skip',
              count: value,
              line: head.line,
              col: head.col,
            });
          }
          break;
        }
        case 'PEN': {
          const token = tokens[i++];
          const colour = token && PEN_COLOURS[token.text.toUpperCase()];
          if (colour === undefined) {
            fail('PEN needs a colour: B, R or Y', token ?? head);
            break;
          }
          blocks.push({ kind: 'pen', colour, line: head.line, col: head.col });
          break;
        }
        case 'REPEAT': {
          const value = count(head);
          const open = tokens[i++];
          if (open?.text !== '[') {
            fail("REPEAT needs a '[' before its body", open ?? head);
            break;
          }
          const inner = body(true);
          if (value !== null) {
            blocks.push({
              kind: 'repeat',
              count: value,
              body: inner,
              line: head.line,
              col: head.col,
            });
          }
          break;
        }
        default:
          fail(`unknown command '${head.text}'`, head);
      }
    }

    if (nested) fail("missing ']' to close REPEAT", tokens[tokens.length - 1]);
    return blocks;
  };

  const blocks = body(false);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, blocks };
}

/**
 * How many commands a Blocks program contains — what the learner typed, not
 * what it compiles to. A REPEAT counts as one command plus its body.
 */
export function countBlocks(blocks: Block[]): number {
  return blocks.reduce(
    (total, block) =>
      total + 1 + (block.kind === 'repeat' ? countBlocks(block.body) : 0),
    0,
  );
}
