# Pixel Machine — Claude Code instructions

You are building Pixel Machine, a web application that teaches assembly
language by wiring a small computer's memory to an 8×8 screen. Portfolio case
study #3. The product, scope, stack and visual system are already decided —
read before writing code:

1. `docs/machine.md` — the instruction set. **Normative.** If your code and
   this file disagree, that is a bug, and which one changes is a decision to
   raise, not to make quietly.
2. `docs/plan.md` — scope, non-goals, phases. Only work on the current phase.
3. `docs/design.md` — visual system, tokens, component structure.
4. `docs/decisions.md` — why things are the way they are.
5. `../docs/plan.md` — the portfolio master plan this sits inside.

## Stack (locked — don't relitigate)

- Next.js 16 (App Router, TypeScript). StyleX for all styling — works under
  Turbopack from 16.0.3 via Babel + PostCSS config, no custom build wiring.
- Supabase for Postgres, auth and RLS. Vercel for deployment.
- Vitest for the suite; Playwright for two end-to-end flows only.
- IBM Plex Sans + IBM Plex Mono, **self-hosted**. No external font requests —
  the original build's one network dependency was Google Fonts and it reflowed
  mid-lesson whenever the connection dropped.

## The one boundary that matters

`src/lib/machine/` imports **nothing**. No React, no Next, no Supabase, no npm
packages. Pure, deterministic TypeScript.

That is what lets the identical code run in the browser for instant feedback
and inside the route handler for leaderboard verification. If those two ever
diverge, the leaderboard becomes fiction. Any change that adds an import to
this directory needs an explicit argument first.

## Rules

- **Never trust the client with a score.** Submissions carry source only; the
  server re-derives the target, re-executes, and counts cycles itself.
- **Determinism is a hard requirement.** Same source, same cycles, same grid,
  every run, both runtimes. No `Math.random` anywhere near the VM — the
  generator uses a seeded PRNG driven by the date.
- **Faults are returned, never thrown past `execute()`.** A program that runs
  away must be impossible to write. The original build shipped a
  `REPEAT 99999 [ ROW ]` that froze the tab on every keystroke; that has a
  permanent regression test.
- **No raw hex outside `src/styles/tokens.stylex.ts`.** Semantic token names
  only — `--paper-raised`, never `--cream-100`. This is checkable; check it.
- **The three pixel inks belong to the grid.** No button, badge, link or focus
  ring may be blue, red or yellow. Chrome uses ink, paper and the accent.
- **Pars are claims, not guesses.** Every lesson's reference solution is
  verified by the test suite to produce its target at exactly its stated par.
  A lesson without a passing golden test is not done.
- **Colour is never the only signal.** Pixel textures, accessible names on
  cells, AA contrast in both themes, visible focus, `prefers-reduced-motion`
  honoured. This is a colour-matching game — treat it as correctness.
- Lesson one is playable with no account. Guest progress in `localStorage`,
  migrated on signup.
- Empty, loading and error states are part of "done", not polish.
- No feature creep past the v1 scope in `docs/plan.md`. Hex and binary are
  Phase 2, other languages are Phase 3 — the architecture already accommodates
  both, so there is no reason to start them early.
- After each meaningful decision, append three lines to `docs/decisions.md`:
  decided, rejected, why.
- Screenshots of finished screens go to `../assets/` for the case study.

## Testing

The VM earns real tests; the UI gets a thin layer. Golden tests on every
lesson par, determinism, generator properties across synthetic dates,
assembler round-trip, fault handling, and the submit endpoint's contract
(anonymous, wrong date, oversized source, wrong grid, upsert-only-on-improve).

## Working style

- Build phases in order. P1 — the whole machine, tested, with no interface —
  comes before any UI. Do not start components early because they are more
  fun; the machine is the product and the UI is decoration over something
  already known to be correct.
- Ask before deviating from `machine.md`, `plan.md` or `design.md`. If
  something in them is wrong in practice, say so and propose the change — do
  not silently diverge.
- British English throughout.
