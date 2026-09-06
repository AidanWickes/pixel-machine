# Pixel Machine — plan

A web application that teaches assembly language by wiring a small computer's
memory to an 8×8 screen. Portfolio case study #3.

Read alongside `design.md` (look and vision), `machine.md` (the instruction
set, normative) and `../CLAUDE.md` (working rules).

---

## Portfolio position

**Third case study, after the kart tracker and the Actifind rebuild.**

`../../docs/plan.md` remains the master plan: Phase A/B kart tracker, Phase C
portfolio site, Phase D Actifind. Pixel Machine is Phase E and does not start
until Phase D is delivered. The master plan needs a Phase E line adding —
that edit has not been made, as it is a gated document.

**Stated risk, accepted:** a project queued third behind two others is the
project most likely never to be built. This is a bigger build than the kart
tracker — it contains a language implementation — and it is scheduled last.
The mitigation is that P1 is independently valuable and independently
demonstrable: a tested VM with no UI is a weekend-sized artefact that proves
the interesting part. If Phase E keeps slipping, build P1 alone and decide
again from there.

---

## What v1 is

- A fictional 8-bit machine: four registers, a program counter, memory-mapped
  8×8 video RAM, twelve opcodes. Specified in `machine.md`.
- An editor with immediate local execution, a visible machine inspector, and
  step/scrub playback.
- Around twelve to fifteen tutorial lessons, ending each with a target picture
  to reproduce.
- The Blocks on-ramp (`FILL`/`SKIP`/`ROW`/`PEN`/`REPEAT`) inside the first few
  lessons only, culminating in the reveal that `REPEAT` compiles to `JNZ`.
- A daily puzzle, procedurally generated from the date, identical for everyone.
- Accounts, profiles, and per-lesson progress tracking.
- One daily leaderboard ranked on cycles executed, verified server-side.
- Light and dark themes; accessible by construction, not by retrofit.

## What v1 is not

Each of these is deferred deliberately, not overlooked.

- **Hand-writing hex or binary** — Phase 2. The encoding already exists in the
  VM, so this is an additive front end, not a rewrite.
- **Other programming languages** — Phase 3, and the reason the architecture is
  "one VM, N front ends" rather than one language hard-wired to one executor.
- **Community-submitted puzzles** — a moderation product in its own right.
- **Classroom or teacher features** — the audience decision was public
  learners; a teacher dashboard would pull every trade-off the other way.
- **Achievements, streak leaderboards, social graph, mobile app.**

---

## Stack (locked — do not relitigate)

- **Next.js 16, App Router, TypeScript.** Chosen over a Vite SPA and over
  TanStack Start because leaderboard verification needs a real server runtime,
  the landing page needs to be indexable, and it is the stack job adverts
  actually name.
- **StyleX** for all styling. Works under Turbopack from Next 16.0.3 via Babel
  and PostCSS config; no custom build wiring required.
- **Supabase** — Postgres, auth, and row-level security. Auth and the database
  are configured rather than hand-built; the interesting engineering in this
  project is the language implementation, and that is where the effort belongs.
- **Vercel** deployment.
- **Vitest** for the suite, **Playwright** for two end-to-end flows.
- `src/lib/machine/` has **zero dependencies**.

---

## Data model

Three tables. The daily puzzle deliberately has none — it is derived from its
date (see `machine.md` §8), so there is nothing to seed and no cron job.

```
profiles           id (FK auth.users) · display_name · created_at
tutorial_progress  (user_id, tutorial_id) PK · completed_at · best_cycles · solution
daily_scores       (user_id, puzzle_date) PK · cycles · source · submitted_at
```

Tutorial content lives in the repository as TypeScript objects, not in the
database. Adding a lesson stays a one-object edit — the property the original
single-file build got right and which is worth preserving.

### Trust boundary

The client submits **source, never a score**. `/api/daily/submit`:

1. authenticate; reject anonymous
2. reject any date that is not today, UTC
3. reject source over 4 KB before parsing
4. re-derive today's target server-side from the date
5. parse, assemble, execute under the cycle cap
6. compare the resulting grid to the target
7. upsert only if it beats the user's existing row

`daily_scores` is readable by its owner alone and writable by nothing on the
client; all writes go through the route handler on the service role. The
public leaderboard is a separate endpoint returning display name, cycles and
rank — never `source`, so solutions cannot be read off the board. Ties break
on earliest submission.

Anonymous progress lives in `localStorage` and migrates into Postgres on first
signup. Lesson one must be playable with no account: a signup wall before any
value is delivered would kill the funnel.

---

## How work is verified

Every step names a check that can be run, so "done" is a command passing rather
than a judgement. The standing gate for all of them is:

```
npm run check     # typecheck + full suite + coverage thresholds
```

The harness that makes this meaningful:

- **`test/helpers.ts`** — `gridFrom` and `draw` express grids as eight
  eight-character rows, so a test states the picture it expects and a failure
  diff shows two pictures rather than two 64-element arrays.
- **`test/conformance.test.ts`** — reads the opcode table out of
  `machine.md` and holds the parser and executor to it. Adding an opcode to the
  document without implementing it fails the suite; so does implementing one
  without a sample program. This is what makes "normative" true rather than
  aspirational.
- **`test/determinism.test.ts`** — repeated runs must agree exactly. The
  leaderboard is only honest while the browser and the server compute the same
  cycle count.
- **Coverage thresholds** on `src/lib/machine` (95% lines, 90% branches, 100%
  functions). Added after untested guards were found sitting in `execute.ts`
  while the suite stayed green — the gate exists because that already happened
  once.
- **`.github/workflows/ci.yml`** — runs `npm run check` on push and pull
  request. No remote is configured yet, so this is dormant until one is added.

---

## Phases

Gated at the phase level, chunked at the step level. Finish a phase, present
it, wait for the go.

**Build order note:** P1 runs first, standalone, ahead of P0. That is the
escape hatch in the portfolio-position section taken deliberately — the machine
needs no framework, no accounts and no deployment, so it can be built and
proven while the rest of the project is still queued. P0 does not start until
Phase E begins properly.

### P1 — The machine, headless  *(in progress)*

No interface at all. Pure TypeScript, zero dependencies.

- [x] **P1.1 Tokeniser** — positions, comment stripping, self-delimiting
      brackets. *Done when:* tokens carry correct line and column.
- [x] **P1.2 Assembly parser** — all twelve opcodes, labels with forward
      references, colour constants. *Done when:* the conformance suite is green.
- [x] **P1.3 Assembler and decoder** — fixed 16-bit words. *Done when:* the
      round-trip test covers every operand form.
- [x] **P1.4 Executor** — all opcodes, wrapping arithmetic, faults, cycle cap.
      *Done when:* a runaway program returns a fault instead of hanging.
- [x] **P1.5 Test harness** — helpers, conformance, determinism, coverage
      thresholds, CI. *Done when:* `npm run check` passes.
- [x] **P1.6 Hex immediates** — `0x` literals per `machine.md` §4.
      *Done when:* `LOAD R0, 0xFF` parses to 255 and `0x100` is rejected.
- [x] **P1.7 Replay frames** — one snapshot per instruction, opt-in, capped at
      `MAX_FRAMES` independently of the cycle cap.
      *Done when:* frame count equals cycle count for a known program, and a
      runaway program stops recording well below the cycle cap.
- [x] **P1.12 Command-line runner** — `npm run draw` renders a program's output
      in the terminal, so the machine is usable before any UI exists.
      *Done when:* the example programs run and are held to their pictures by
      the suite.
- [x] **P1.8 Blocks parser** — the five workshop commands, nested `REPEAT`.
      *Done when:* every original target program parses.
- [x] **P1.9 Blocks compiler** — Blocks to instructions.
      *Done when:* each original target draws its exact picture, and `REPEAT`
      is asserted to emit a `JNZ` loop rather than unrolled code.
- [x] **P1.13 Disassembler** — instructions back to assembly source, so a
      learner can see what their Blocks became. Beyond the original plan; added
      because the compiler's output is the teaching artefact.
      *Done when:* its output re-parses to the instructions it came from.
- [x] **P1.10 Daily generator** — seeded by date, generated backwards from a
      random Blocks program, with the quality gate.
      *Done when:* 500 synthetic dates each produce a puzzle that passes the
      gate and is reproduced identically on a second call.
- [ ] **P1.11 Reference lessons and pars** — the lesson data and its golden
      tests. *Done when:* every lesson solution hits its stated par exactly.

**Gate:** `npm run check` green; every par verified rather than claimed.

### P0 — Scaffold  *(deferred until Phase E starts)*

- [ ] **P0.1** Next 16 App Router + TypeScript, StyleX wired via Babel and
      PostCSS. *Done when:* a StyleX-styled page renders in a production build.
- [ ] **P0.2** Tokens from `design.md` §4 into `tokens.stylex.ts`, both themes.
      *Done when:* no raw hex outside the token file, checked in CI.
- [ ] **P0.3** Self-hosted IBM Plex subsets. *Done when:* the page makes zero
      external font requests.
- [ ] **P0.4** Supabase project, three tables, RLS policies.
      *Done when:* migrations apply from clean.
- [ ] **P0.5** Vercel deployment. *Done when:* a live URL renders both themes
      and the full contrast matrix is measured and recorded.

### P2 — Play surface

- [ ] **P2.1 `PixelGrid`** — current, target, and diff overlay.
      *Done when:* a known grid renders correctly and wrong cells are marked.
- [ ] **P2.2 `CodeEditor`** — source input with error markers.
      *Done when:* a parse error appears at its reported line and column.
- [ ] **P2.3 `MachineInspector`** — registers, program counter, cycle count.
      *Done when:* values track the selected frame.
- [ ] **P2.4 `Transport`** — step, play, pause, scrub over frames.
      *Done when:* scrubbing is frame-accurate and reduced motion jumps
      straight to the final frame.
- [ ] **P2.5 Responsive layout** — three breakpoints.
      *Done when:* the inspector is never removed at any width.

**Gate:** browser review, desktop and mobile.

### P3 — Tutorials

- [ ] **P3.1** Lesson data shape and loader.
- [ ] **P3.2** Blocks lessons 1–4.
- [ ] **P3.3** The reveal — the same picture as Blocks and as assembly,
      side by side.
- [ ] **P3.4** Assembly lessons through to the full instruction set.
- [ ] **P3.5** Progress in `localStorage`, no account required.

**Gate:** somebody unfamiliar with assembly completes lessons 1–5 unaided.
A real test with a real person, not a self-assessment.

### P4 — Accounts

- [ ] **P4.1** Supabase auth: signup, login, logout.
- [ ] **P4.2** `profiles` and display names.
- [ ] **P4.3** RLS policies. *Done when:* a test proves one user cannot read
      another user's rows.
- [ ] **P4.4** `localStorage` to Postgres migration on first signup.
      *Done when:* guest progress survives account creation.

**Gate:** signup, logout, login, progress survives; RLS verified by attack.

### P5 — Daily and leaderboard

- [ ] **P5.1** Daily route wired to the generator.
- [ ] **P5.2** Submit endpoint with server-side verification.
- [ ] **P5.3** `daily_scores` upsert, improvement only.
- [ ] **P5.4** Leaderboard endpoint and table, ranked on cycles.
- [ ] **P5.5** Cheat suite. *Done when:* a posted false score, a wrong-grid
      solution, an oversized source, and a submission dated yesterday are all
      rejected.

**Gate:** the cheat suite passes.

### P6 — Polish and case study

- [ ] **P6.1** Accessibility audit: axe, keyboard pass, contrast in both
      themes, pixel textures.
- [ ] **P6.2** Empty, loading and error states throughout.
- [ ] **P6.3** Screenshots to `../../assets/` and the case-study draft.

**Gate:** live, sendable, written up.

---

## Reevaluation triggers

- **P1 + P2 exceed ~3 weeks of real effort** → cut the Blocks on-ramp to Phase
  2 and ship assembly-only. The on-ramp is the most expendable scope in v1.
- **P3's gate fails** — an unfamiliar person cannot clear lesson 5 → stop and
  redesign the curriculum. Do not proceed to accounts for a product nobody can
  learn from.
- **Generated puzzles read as boring at P5** → add a handcrafted override queue
  checked before the generator. The generator stays as the fallback so there is
  never a content cliff.
- **Phase D slips such that Phase E has not started within a year** → build P1
  standalone and reassess.

---

## Open questions

- The master plan (`../../docs/plan.md`) needs a Phase E entry. Not added — it
  is gated and the edit is Aidan's to approve.
- Lesson count is an estimate. The real number falls out of P3.
- Whether the leaderboard needs seeding with reference solutions so it is not
  empty at launch. Decide at P5.

---

## Current status

**P1 in progress — only P1.11 remains.** Both languages
parse; Blocks compiles to instructions with `REPEAT` emitting a real `JNZ`
loop; the machine executes, faults and records replay frames; and programs run
from the command line in either language, with `--asm` showing what Blocks
became. The daily generator derives a puzzle from its date alone, solvable by
construction. Verified by 122 tests with `npm run check` green.

Remaining in P1: the reference lessons with their golden pars.

Nothing else is scaffolded. P0 has not started and does not start until Phase D
delivers.

The original single-file workshop build (South Devon College Headstart taster,
546 lines of HTML plus a Python twin) is the ancestor of this project and no
longer exists on disk. Its language, its ten targets and its verified pars are
recorded in `machine.md` §7 and in the decision log.
