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
| **Cost** | one cycle per instruction executed; scoring counts commands written |

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

**P1 is complete and banked. There is no web interface yet, by choice.**

The virtual machine, both languages, the puzzle generator and the curriculum
are built and tested headless, ahead of any UI. The machine is the product;
building it first means the interface will be decoration over something already
known to be correct.

Everything runs from the command line today. The web application is the next
phase and has not been started.

| Phase | |
|---|---|
| **P1** The machine, headless | **complete** — 161 tests |
| **P0** Scaffold (Next.js, StyleX, Supabase) | next |
| **P2** Play surface | not started |
| **P3** Tutorials | not started |
| **P4** Accounts | not started |
| **P5** Daily puzzle and leaderboard | not started |
| **P6** Polish | not started |

P1 is done: both languages parsing, the Blocks compiler, assembler, decoder and
disassembler, an executor with faults and a cycle cap, replay frames for the
future transport, the date-seeded daily generator, fourteen lessons with
measured pars, a command-line runner, and the verification harness.

Next is P0 — the web application scaffold.

Full breakdown with per-step acceptance criteria: [`docs/plan.md`](docs/plan.md).

## Getting started

```bash
npm install
```

Node 24 or later. No other setup — the machine has zero runtime dependencies.

### Verifying it works

```bash
npm test          # 161 tests
npm run check     # typecheck + tests + coverage thresholds — the full gate
npm run coverage  # tests with the coverage report
npm run typecheck # types only
```

`npm run check` is the gate CI runs. It fails if types break, if any test
fails, or if coverage of `src/lib/machine` drops below its thresholds.

What those tests actually prove is described under [Testing](#testing).

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

### Two languages

Blocks is the gentle on-ramp — the language from the original workshop. It
compiles to the same instructions the assembly does, and `--asm` shows you
exactly what it became:

```bash
npm run draw -- examples/stripes.blocks --asm
```

```
REPEAT 4 [ FILL 8 ROW ]
```

```
  ████████████████
  · · · · · · · ·
  ████████████████
  · · · · · · · ·
  ████████████████
  · · · · · · · ·
  ████████████████
  · · · · · · · ·

  compiled to:
    ...
   19  ADDI R0, 8
   20  SUBI R1, 1
   21  JNZ R1, 3
   22  HALT
```

That last pair is the whole point of the curriculum: your `REPEAT` was a
`JNZ` loop all along. Blocks never appears on the leaderboard — it exists to
carry you to that moment, after which everything is assembly.

### The daily puzzle

Every day's puzzle is derived from its date by a pure function — no database,
no cron job, no coordination. The browser and the server compute the identical
puzzle from the date alone.

```bash
npm run draw -- --daily
npm run draw -- --daily 2026-12-25
```

It is generated *backwards*: build a random Blocks program, run it, and whatever
it draws is the puzzle. Solvable by construction, and par falls out free as the
generating program's cycle count. Par is an upper bound, not a proven optimum —
which is why it is presented as "beat it".

### The lessons

Fourteen lessons carry you from painting three pixels to reading the screen back
into a register. Four are in Blocks, ten in assembly, and between them they use
every instruction in the set.

```bash
npm run draw -- --lessons
npm run draw -- --lesson nested-loops
```

Every lesson states its target picture by hand, and the suite proves the
reference solution draws exactly that in exactly its stated par. A par is a
claim made to a stranger, so it is measured and locked rather than estimated.

**Scoring is on commands written, not cycles run** — `100 × par / commands`,
capped at 100. That is what a beginner means by "steps", and it is the metric
the original workshop used. Cycles are still measured and shown beside the
command count, because the contrast is the lesson: the stripes program is three
commands to write and eighty cycles to run.

### Running in Docker

If you would rather npm never touched your machine, everything runs in a
container instead. Dependencies install inside it, their lifecycle scripts run
inside it, and `node_modules` lives in a Docker volume rather than on the host.

Verified on OrbStack: `npm ci` completes as the unprivileged `node` user and the
full suite passes inside the container.

```bash
docker compose build
docker compose run --rm app npm test
docker compose run --rm app npm run check
docker compose run --rm app npm run draw -- examples/border.asm
docker compose run --rm app bash          # a shell in the container
```

When you are done, shut it all down:

```bash
docker compose down --remove-orphans      # containers and network
docker compose down --remove-orphans -v   # …and the node_modules volume
```

Plain `down` does not remove one-off `run` containers, which then block the
network from being removed — hence `--remove-orphans`.

Source is bind-mounted, so edits on the host take effect immediately without
rebuilding.

**After changing dependencies**, rebuild and discard the volume — otherwise the
named `node_modules` volume keeps serving the old packages:

```bash
docker compose down -v && docker compose build
```

Shorthands exist for each of these (`npm run docker:test`, `docker:check`,
`docker:draw`, `docker:shell`, `docker:reset`), though they run npm on the host
to invoke Docker. Use the raw `docker compose` commands above if the point is
to avoid host npm entirely.

## How it is built

```
Assembly ──→ parse ───┐
                      ├──→ instructions ──→ assemble ──→ words ──→ execute()
Blocks ──→ compile ───┘                          │
                                                 └──→ disassemble ──→ assembly
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

161 tests, ~100% line coverage on the machine.

- **Conformance** — the suite parses the opcode table out of `docs/machine.md`
  and holds the implementation to it. Document an opcode without building it
  and the tests fail. It is what makes that document normative rather than
  aspirational.
- **Determinism** — repeated runs must agree exactly, because the leaderboard
  depends on the browser and the server computing the same number.
- **Faults** — a runaway program returns a fault instead of hanging. This is a
  regression test with history: the ancestor of this project shipped a loop
  that froze the browser tab on every keystroke.
- **Curriculum coverage** — every instruction in that same table is taught by
  at least one lesson, so the course cannot leave a hole the learner falls into.
- **Pars** — each lesson's reference solution is proved to draw its stated
  target in exactly its stated number of commands, and to score 100 against its
  own par. A par is a claim made to a stranger who will chase it, so it is
  measured and locked rather than estimated.
- **Coverage thresholds** on `src/lib/machine`, enforced in CI. Added after
  untested guards were found sitting in the executor while the suite stayed
  green — and it has since caught two more gaps the same way.

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
