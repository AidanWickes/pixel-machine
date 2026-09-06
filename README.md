# Pixel Machine

**Learn assembly language by making it draw.**

[![CI](https://github.com/AidanWickes/pixel-machine/actions/workflows/ci.yml/badge.svg)](https://github.com/AidanWickes/pixel-machine/actions/workflows/ci.yml)

Assembly is not hard because it is complex. It is hard because it is
invisible — nothing happens that you can see. Pixel Machine wires a small
computer's memory directly to an 8×8 screen, so `STORE R2, [R0]` stops being an
abstraction and becomes a pixel going blue.

Four registers, a program counter, twelve instructions. No stack, no flags, no
hidden machinery. Small enough to hold in your head, complete enough to be real.

---

## The machine

| | |
|---|---|
| **Registers** | `R0`–`R3`, 8-bit, arithmetic wraps at 256 |
| **Screen** | 64 cells memory-mapped at addresses `0`–`63` |
| **Cell values** | `0` off · `1` blue · `2` red · `3` yellow |
| **Instructions** | `HALT` `LOAD` `LOADI` `MOV` `ADD` `ADDI` `SUB` `SUBI` `STORE` `JMP` `JNZ` `JZ` |
| **Encoding** | fixed 16-bit words — `[opcode:4][rd:2][rs:2][imm:8]` |
| **Cost** | one cycle per instruction executed |

There is no `INC`, no `CMP`, no multiply. A loop is a `SUBI` and a `JNZ` —
discovering that is the whole point.

`HALT` encodes to `0x0000`, so a program that runs off the end into zeroed
memory stops rather than misbehaving. Real machine behaviour, shown rather
than explained.

Full reference: [`docs/machine.md`](docs/machine.md).

## An example

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

```
BBBBBBBB
........
........
........
........
........
........
........
```

36 cycles: three to set up, four per iteration for eight iterations, then
`HALT`. That number is asserted by the test suite, not estimated.

## Status

**Early. The machine works; there is no interface yet.**

The virtual machine is built and tested headless, ahead of any UI — it is the
product, and building it first means the interface will be decoration over
something already known to be correct.

| Phase | |
|---|---|
| **P1** The machine, headless | in progress — 8 of 12 steps |
| **P0** Scaffold (Next.js, StyleX, Supabase) | not started |
| **P2** Play surface | not started |
| **P3** Tutorials | not started |
| **P4** Accounts | not started |
| **P5** Daily puzzle and leaderboard | not started |
| **P6** Polish | not started |

Done so far: tokeniser, assembly parser with labels, forward references and hex
literals, assembler and decoder, executor with faults and a cycle cap, replay
frames for the future transport, a command-line runner, and the verification
harness.

Next: the Blocks compiler, the daily puzzle generator, and the reference
lessons.

Full breakdown with per-step acceptance criteria: [`docs/plan.md`](docs/plan.md).

## Getting started

```bash
npm install
npm test          # the suite
npm run check     # typecheck + suite + coverage thresholds
```

Node 24 or later.

### Run a program

There is no web interface yet — that is P2. Until then the machine runs from
the command line:

```bash
npm run draw -- examples/border.asm
npm run draw -- examples/diagonal.asm
npm run draw -- -e "LOAD R2, RED
                    LOAD R0, 27
                    STORE R2, [R0]
                    HALT"
```

```
  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
  ▒▒· · · · · · ▒▒
  ▒▒· · · · · · ▒▒
  ▒▒· · · · · · ▒▒
  ▒▒· · · · · · ▒▒
  ▒▒· · · · · · ▒▒
  ▒▒· · · · · · ▒▒
  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒

  122 cycles · 26 instructions
  registers  R0=63  R1=0  R2=3  R3=0
```

Programs that will not parse report the line and column rather than failing
silently. The example programs in `examples/` are held to their pictures by the
test suite, so they cannot quietly rot.

## How it is built

```
Assembly ──→ parse ──┐
                     ├──→ instructions ──→ assemble ──→ words ──→ execute()
Blocks ───→ compile ─┘
```

One executor, several front ends. That is why "show me this as assembly" comes
free, and why later phases — hand-written machine code, then other languages —
are additive front ends rather than rewrites.

**`src/lib/machine/` imports nothing.** No framework, no packages, no I/O. Pure
deterministic TypeScript.

That boundary is the point. The identical code runs in the browser for instant
feedback while you type, and on the server to verify leaderboard submissions.
Players will submit source, never a score; the server re-derives the target,
re-executes, and counts the cycles itself. If those two ever disagreed, the
leaderboard would be fiction — keeping the module pure means there is nothing
to drift.

## Testing

82 tests, 100% line coverage on the machine.

- **Conformance** — the suite parses the opcode table out of `docs/machine.md`
  and holds the implementation to it. Document an opcode without building it
  and the tests fail. It is what makes that document normative rather than
  aspirational.
- **Determinism** — repeated runs must agree exactly, because the leaderboard
  depends on the browser and the server computing the same number.
- **Faults** — a runaway program returns a fault instead of hanging. This is a
  regression test with history: the ancestor of this project shipped a loop
  that froze the browser tab on every keystroke.
- **Coverage thresholds** on `src/lib/machine`, enforced in CI. Added after
  untested guards were found sitting in the executor while the suite stayed
  green.

## Documentation

| | |
|---|---|
| [`docs/machine.md`](docs/machine.md) | instruction set — normative |
| [`docs/plan.md`](docs/plan.md) | scope, non-goals, phases |
| [`docs/design.md`](docs/design.md) | visual system and vision |
| [`docs/decisions.md`](docs/decisions.md) | what was decided, what was rejected, why |

## Licence

[MIT](LICENSE).

## Background

Pixel Machine descends from a single-file HTML build written for a Headstart
taster session at South Devon College — a tiny drawing language of `FILL`,
`SKIP`, `ROW` and `REPEAT` on the same 8×8 grid. That language survives here as
a tutorial on-ramp, and ends with the reveal that `REPEAT` was a `JNZ` loop all
along.
