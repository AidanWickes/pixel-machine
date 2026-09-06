# The Pixel Machine — instruction set reference

The contract `src/lib/machine/` is built against. This document is normative:
if the implementation and this file disagree, one of them is a bug, and which
one is a decision to be made explicitly rather than silently.

---

## 1 · The machine

- **Registers:** `R0` `R1` `R2` `R3`, 8-bit unsigned. Arithmetic wraps modulo
  256. Wrapping is authentic and teachable — do not saturate.
- **Program counter:** instruction index, 0–255. A program is at most 256
  instructions.
- **Video RAM:** 64 cells, addresses `0`–`63`, memory-mapped to the 8×8 screen.
  `address = row × 8 + col`, row 0 at the top, col 0 at the left.
- **Cell values:** `0` off · `1` blue · `2` red · `3` yellow. Nothing else is
  valid.
- **No stack. No flags. No general RAM.** Four registers and the screen is the
  entire state. Anything a program needs to remember lives in a register or is
  recomputed.

Execution starts at instruction 0 and stops on `HALT`, on a fault, or on
exhausting the cycle cap.

---

## 2 · Instruction set

Twelve opcodes.

| Op | Mnemonic | Effect |
|----|----------|--------|
| `0x0` | `HALT` | stop execution |
| `0x1` | `LOAD  Rd, imm` | `Rd = imm` |
| `0x2` | `LOADI Rd, [Rs]` | `Rd = screen[Rs]` — read a pixel |
| `0x3` | `MOV   Rd, Rs` | `Rd = Rs` |
| `0x4` | `ADD   Rd, Rs` | `Rd = (Rd + Rs) mod 256` |
| `0x5` | `ADDI  Rd, imm` | `Rd = (Rd + imm) mod 256` |
| `0x6` | `SUB   Rd, Rs` | `Rd = (Rd − Rs) mod 256` |
| `0x7` | `SUBI  Rd, imm` | `Rd = (Rd − imm) mod 256` |
| `0x8` | `STORE Rs, [Rd]` | `screen[Rd] = Rs` — write a pixel |
| `0x9` | `JMP   imm` | `PC = imm` |
| `0xA` | `JNZ   Rs, imm` | if `Rs ≠ 0` then `PC = imm` |
| `0xB` | `JZ    Rs, imm` | if `Rs = 0` then `PC = imm` |

There is no `INC`, no `CMP`, no `MUL`, no `DIV`. A loop is a `SUBI` and a
`JNZ`; discovering that is the point of the product.

`ADDI`/`SUBI` exist so that counting does not permanently consume a register
just to hold the constant `1`. Reg-to-reg-only arithmetic is authentic to some
real machines but the friction teaches nothing.

`LOADI` exists so puzzles can depend on pixels already on screen, which is
what makes conditional logic worth writing.

---

## 3 · Encoding

Fixed 16-bit words:

```
 15    12 11 10  9  8  7                     0
┌────────┬─────┬─────┬───────────────────────┐
│ opcode │ rd  │ rs  │       immediate       │
│   4    │  2  │  2  │           8           │
└────────┴─────┴─────┴───────────────────────┘
```

Unused fields are zero. `HALT` therefore encodes to `0x0000`, which means
program memory past the final instruction reads as `HALT` — a program that
runs off the end stops rather than misbehaving. That is real machine behaviour
and worth showing rather than explaining.

Displayed as four hex digits or sixteen binary digits. Users do not write
encoded words in v1; the encoding exists because `execute()` runs on it, and
because Phase 2 surfaces it as a third front end without any change here.

---

## 4 · Assembly syntax

```asm
; draw a blue row across the top
        LOAD  R0, 0          ; R0 = cursor address
        LOAD  R1, 8          ; R1 = counter
        LOAD  R2, BLUE       ; R2 = colour
loop:   STORE R2, [R0]
        ADDI  R0, 1
        SUBI  R1, 1
        JNZ   R1, loop
        HALT
```

- `;` begins a comment, running to end of line.
- Labels are `name:` at the start of a line and resolve to an instruction
  index. Forward references are allowed.
- Mnemonics, register names and label references are case-insensitive.
- `OFF` `BLUE` `RED` `YELLOW` are assembler constants for `0` `1` `2` `3`.
  They cost nothing at runtime and make source readable.
- Immediates are decimal, or hex with a `0x` prefix.

---

## 5 · Cycles

**One cycle per instruction executed.** Flat, with no exceptions.

A branch not taken still costs a cycle. `HALT` costs a cycle. The number the
leaderboard shows is therefore exactly the number of instructions the machine
carried out, which is what a beginner already assumes "steps" means.

`MAX_CYCLES = 100_000`. Exceeding it is a fault, not a silent stop. The cap is
sub-millisecond to reach and orders of magnitude beyond any legitimate
solution, so it doubles as the server's denial-of-service bound — execution is
bounded by construction and needs no wall-clock timeout.

### Replay frames

`execute(words, { frames: true })` records one frame per executed instruction,
for the editor's transport:

```ts
{ cycle, pc, registers, write?: { address, colour } }
```

`pc` is the instruction that ran, and the registers are its result, so a frame
answers "what did this line just do".

Recording is **opt-in and off by default**. Server-side verification needs only
the final grid and the cycle count, and must not pay to build a replay nobody
watches.

`MAX_FRAMES = 2_000`, capped independently of `MAX_CYCLES`. A runaway program
would otherwise allocate a snapshot per cycle. Teaching programs run to tens or
low hundreds of cycles, so the ceiling is invisible in normal use; when it is
hit, `frames.length` is less than `cycles` and the transport can say so.

---

## 6 · Errors

### Parse and assemble (static)

Every error carries line and column.

- unknown mnemonic
- bad or missing operand; wrong operand form for the opcode
- register outside `R0`–`R3`
- immediate outside `0`–`255`
- undefined label; duplicate label
- program longer than 256 instructions

### Runtime faults

Halt execution and retain the frame that caused them, so the failure is shown
on the grid rather than described in a message.

- `STORE`/`LOADI` to an address above `63`
- `STORE` of a value above `3`
- cycle cap exhausted

Faults are values returned from `execute()`, never thrown past it. A runaway
program must be impossible to write — this is a permanent regression test, as
the original build shipped a `REPEAT 99999 [ ROW ]` that froze the browser tab
on every keystroke.

---

## 7 · Blocks — the tutorial on-ramp

```
FILL n | SKIP n | ROW | PEN B|R|Y | REPEAT n [ ... ]
```

The language from the original workshop, preserved. A pen starts at address 0
and moves left to right; `ROW` advances to the start of the next row and is
the only way down. `FILL` paints and advances; `SKIP` advances without
painting.

**Blocks is tutorial-only and never appears on the leaderboard.** It exists to
carry a beginner to the moment where the same picture is shown as assembly and
`REPEAT` turns out to have been a `JNZ` all along.

Because it never competes, its compiler optimises for **readable output, not
minimal cycles**. Emitted assembly must be something a learner can read
alongside their Blocks source and follow line by line. This removes any need
for the compiler to be competitive, which is a large amount of work avoided.

Register convention for compiled output:

```
R0   cursor address
R1   loop counter, outer REPEAT
R2   current pen colour
R3   loop counter, inner REPEAT
```

`REPEAT` compiles to a real `JNZ` loop rather than unrolled straight-line
code — the reveal only works if the loop is visible in the output.

**`FILL` unrolls** to `STORE`/`ADDI` pairs. That is fewer instructions *and*
fewer cycles than a counted loop, it needs no counter register, and it leaves
`REPEAT` as the only thing in the output that produces a `JNZ` — which sharpens
the reveal rather than muddying it.

**The cursor is tracked at compile time.** `ROW` must advance
`8 - (pos mod 8)` cells, which would need a division the machine does not have;
but every count in Blocks is a literal, so the position is always known and
`ROW` becomes a single `ADDI`. Inside a `REPEAT` this only holds when the body's
net displacement is a whole number of rows — otherwise `ROW` would move a
different distance on each pass, and the compiler rejects it rather than
emitting wrong output.

**Two levels of `REPEAT`.** Nesting is bounded by the two spare registers, `R1`
and `R3`. Deeper nesting is a compile error rather than silent corruption.

---

## 8 · The daily generator

`generateDaily(dateISO)` is pure and deterministic. Same date, same puzzle,
on every machine, forever. No storage, no cron job, no coordination between
client and server.

1. Hash the date string into a seed; drive a small seeded PRNG (implemented
   inline — this does not justify a dependency).
2. Generate a random valid **Blocks program**. Blocks, not assembly: it always
   terminates and always produces picture-like output, so every candidate is
   valid by construction rather than by luck.

   Rows are built from runs of `FILL` and `SKIP` summing to exactly 8, so the
   cursor lands on the next row without needing `ROW`. A *period* — how many
   rows pass before the picture repeats — is drawn from 2, 3, 4 or 8, and the
   repeating block is wrapped in a `REPEAT`. Small periods give banded pictures
   that compress well; period 8 gives every row its own pattern and no loop at
   all. Mixing them is what stops every day looking alike.
3. Execute it. **Whatever it draws is the puzzle** — solvable by construction,
   with no solver search required anywhere in the system.
4. Quality gate: reject if fewer than 12 or more than 56 cells are lit, or if
   fewer than two colours are used. A solid grid is 64 lit and so is already
   excluded. Reject means re-roll with an incremented seed, bounded at 50
   attempts, after which the best attempt so far is returned — a dull puzzle
   beats no puzzle, and the gate is a preference rather than a correctness
   requirement.
5. Return `{ grid, par, seed }`, where `par` is the generating program's cycle
   count.

`par` is an upper bound and is presented as one: *"reference solution: 47
cycles — beat it"*. Claiming optimality would be a lie, and the honest framing
is the better hook anyway.

The day rolls at **00:00 UTC**, stated plainly in the interface.

---

## 9 · Module boundaries

```
tokenise.ts      source → tokens                    (shared by both languages)
parse.ts         tokens → instructions              (assembly)
blocks.ts        tokens → Block AST                 (Blocks)
compile.ts       Block AST → instructions
assemble.ts      instructions ⇄ encoded words       (round-trips)
disassemble.ts   instructions → assembly source
execute.ts       words → { frames, cycles, grid, fault? }
generate.ts      date → { grid, par, seed }
```

Blocks parsing lives in its own module rather than inside `parse.ts`. Two
languages in one file would make it the largest thing in the project and blur
which grammar an error belongs to.

`src/lib/machine/` imports nothing. No React, no Next, no Supabase, no npm
dependencies. That is what allows the identical code to run in the browser for
instant feedback and inside the route handler for leaderboard verification.

**This boundary is the product's integrity.** If verification ever drifts from
what the player ran locally, the leaderboard becomes fiction. Keep the module
pure and there is nothing to drift.
