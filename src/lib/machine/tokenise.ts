export interface Token {
  text: string;
  line: number;
  col: number;
}

/** Splits source into positioned tokens. Whitespace and commas separate. */
export function tokenise(source: string): Token[] {
  const tokens: Token[] = [];

  source.split('\n').forEach((raw, index) => {
    const line = index + 1;
    // A ';' comments out the rest of the line. Truncating keeps every
    // surviving token's column identical to its position in the source.
    const text = raw.split(';')[0] ?? '';
    let buf = '';
    let col = 0;

    for (let i = 0; i <= text.length; i++) {
      const ch = text[i];
      const isBracket = ch === '[' || ch === ']';

      if (ch !== undefined && !isBracket && !/[\s,]/.test(ch)) {
        if (buf === '') col = i + 1;
        buf += ch;
        continue;
      }

      if (buf !== '') {
        tokens.push({ text: buf, line, col });
        buf = '';
      }
      // Brackets self-delimit, so both languages can write them unspaced:
      // 'STORE R2, [R0]' in assembly, 'REPEAT 4 [ ... ]' in Blocks.
      if (isBracket) tokens.push({ text: ch, line, col: i + 1 });
    }
  });

  return tokens;
}
