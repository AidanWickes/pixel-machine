# Decision log — Pixel Machine

Append three lines per decision: what was decided · what was rejected · why.
This file feeds the case study — write it as it happens, not from memory.

---

**Origin** — Pixel Machine descends from a single-file HTML workshop build
(546 lines, plus a Python twin) written for a South Devon College Headstart
taster session. Language: `FILL n | SKIP n | ROW | PEN B/R/Y | REPEAT n [ ... ]`
on an 8×8 grid, pen starting top-left, `ROW` the only way down. Ten targets
with pars verified by a Node script, best scores in `localStorage`, frame-based
replay. That repository no longer exists on disk; this is a ground-up rebuild,
not a port.

**Audience** — Public learners on the internet. Rejected: students first
(classroom tool), recruiters first (portfolio showpiece), and a
students-first/recruiters-second blend. Why: optimising for onboarding,
retention and a shareable daily loop produces the broadest product; a
classroom tool would have pulled every trade-off toward guest mode, teacher
dashboards and offline resilience instead.

**Subject** — Assembly language, with hex/binary and other languages as later
phases. Rejected: teaching machine code from the outset (the initial framing,
corrected); staying with the drawing DSL and renaming the promise; targeting a
real ISA such as 6502 or CHIP-8. Why: the original DSL taught loops, not
machine code, so the promise and the product had to be reconciled; a fictional
small machine keeps the concepts transferable without a real ISA's hostility
to beginners.

**Architecture** — One VM, N front ends: every language funnels through parse
→ instructions → encoded words → a single `execute()`. Rejected: separate
interpreters per language. Why: one executor means one cycle count and one
definition of correct; "show me this as assembly" becomes free; and Phase 2
(hex/binary) and Phase 3 (other languages) are additive front ends rather than
rewrites.

**Instruction set** — Twelve opcodes, four 8-bit registers, memory-mapped 8×8
video RAM, fixed 16-bit encoding. Rejected: the initial eight-opcode set.
Why: eight was tuned for a rung users pass through on the way to binary; once
assembly became the destination rather than the middle, reg-to-reg-only
arithmetic meant permanently burning a register to hold the constant 1 —
friction that teaches nothing. Added `ADDI`/`SUBI`, `JZ` and `LOADI`.

**Blocks DSL** — Kept as a tutorial-only on-ramp, never on the leaderboard.
Rejected: cutting it entirely; keeping it as a co-equal competitive mode;
deferring it to Phase 2. Why: it is a proven on-ramp and it sets up the
product's best teaching moment — `REPEAT` revealed as a `JNZ` loop. Because it
never competes, its compiler can optimise for readable output instead of tight
cycles, which avoids a large amount of work.

**Leaderboard metric** — One board, cycles executed, assembly only. Rejected:
a board per tier; ranking on source length; par-relative scoring. Why: cycles
are tier-agnostic and mean exactly what a beginner assumes "steps" means.
Confining competition to assembly removed the cross-tier fairness problem
entirely. One cycle per instruction, flat, so the number needs no explaining.

**Daily puzzles** — Purely procedural, seeded by date, generated backwards:
produce a random valid program, run it, and whatever it draws is the puzzle.
Rejected: a handcrafted queue with a generated fallback; curation only;
community submissions. Why: zero content treadmill and infinite runway;
generating from solutions means puzzles are solvable by construction and par
falls out free as the reference program's cycle count, so no solver search is
needed anywhere in the system. A quality gate rejects boring output.

**Puzzle storage** — None. The daily puzzle is derived from its date by a pure
function, so client and server compute it identically with no coordination.
Rejected: a puzzles table seeded by a cron job. Why: nothing to seed, nothing
to fall over at midnight, and verification needs no lookup.

**Par framing** — Presented as "reference solution: N cycles — beat it", an
explicit upper bound. Rejected: claiming optimality. Why: the generator's
program is not proven optimal, so claiming so would be false; and inviting
players to beat it is the better hook anyway.

**Stack** — Next.js 16 (App Router) + StyleX + Supabase + Vercel. Rejected:
Vite + React Router + Supabase; TanStack Start; Next.js with Neon and hand-
built Auth.js. Why: verification needs a real server runtime and the landing
page needs to be indexable, which rules out the SPA; TanStack Start is pleasant
but unproven and less recognised on a portfolio piece; Supabase means auth and
the database are configured rather than built, keeping effort on the language
implementation, which is the interesting engineering here. StyleX build
friction is no longer a deciding factor — it works under Turbopack from Next
16.0.3 via Babel and PostCSS config.

**Atomic design** — Atoms, molecules and organisms as real directories;
templates and pages left to the App Router. Rejected: all five layers as
folders. Why: routes and layouts already are templates and pages; duplicating
them would create structure whose only purpose is completing a diagram.

**Build order** — The whole VM, tested, with no interface, before any UI.
Rejected: building the play surface alongside the machine. Why: the machine is
the product; a headless, tested core means the UI is decoration over something
already known to be correct, and design flaws surface while changing course is
still cheap.

**Visual direction** — "Machine room": warm paper ground, ink type, mechanical
detailing, museum-panel clarity. Rejected: the CRT phosphor-and-scanlines
treatment. Why: it is the exhausted default costume for anything involving
assembly, and it actively harms legibility in a product where users read hex
columns for twenty minutes at a stretch. Reference points are punch cards,
line printers and Olivetti/IBM industrial design — early-computing print
rather than early-computing screen.

**Reserved inks** — Blue, red and yellow belong to the grid; interface chrome
uses ink, paper and one muted accent. Rejected: a conventional palette drawing
from the same hues. Why: the user's task is matching colours on a grid, so any
chrome sharing those colours competes with the task and creates false signal.

**Typeface** — IBM Plex Sans and IBM Plex Mono, self-hosted. Rejected: Google
Fonts delivery; a display face for headings. Why: IBM built the machines this
teaches, which makes it a type decision with an actual answer behind it; and
self-hosting fixes the original build's only network dependency, which
reflowed the page mid-lesson whenever the connection died.

**Accessibility** — Pixel textures (solid, hatch, dots) as a first-class
toggle, echoing the original terminal version's `█ ▓ ▒`. Rejected: colour
alone with a contrast pass. Why: this is a colour-matching game, so
colour-only differentiation excludes colourblind users from the whole product
rather than from a detail of it. Treated as correctness, not accommodation.

**Portfolio position** — Third case study, built after the kart tracker and
the Actifind rebuild. Rejected: replacing Actifind as #2; taking the #1 slot
and pausing the kart tracker; building it outside the portfolio plan
entirely. Why: Aidan's call, made with the queueing risk stated — a project
scheduled third behind two others is the one most likely never to be built.
Mitigation recorded in `plan.md`: P1 is independently valuable and can be
built standalone if Phase E keeps slipping.

**Bracket tokenising** — `[` and `]` are always their own tokens, emitted
unspaced. Rejected: keeping `[R0]` as a single token for the parser to strip.
Why: both languages need brackets — `STORE R2, [R0]` in assembly and
`REPEAT 4 [ ... ]` in Blocks — and one self-delimiting rule serves both without
either parser doing string surgery.

**Fault representation** — `execute()` returns `{ fault }` in its result;
nothing throws past it. Rejected: throwing and catching at the call site. Why:
the editor re-runs on every keystroke, so a fault is an ordinary outcome to
render, not an exception. Proven by a regression test that reproduced the
original build's freeze — before the cycle cap existed, `loop: JMP loop` hung
the test runner outright (exit 124).

**Verification harness** — `machine.md`'s opcode table is parsed by the test
suite and the implementation is held to it; coverage thresholds guard
`src/lib/machine`. Rejected: a hand-maintained list of implemented opcodes in
code, and coverage as an advisory number. Why: a hand-maintained list drifts
from the document it mirrors, moving the problem rather than solving it; and
untested guards had already been found sitting in `execute.ts` while the suite
stayed green, so the threshold exists because that failure actually occurred.

**Parse error recovery** — an unknown mnemonic skips to the next line.
Rejected: continuing token by token. Why: the orphaned operands were being read
as further instructions, so a single typo reported three errors and two of them
pointed at valid code. Found by the error-path tests the coverage gate forced.

**Test runner** — Vitest 5. Rejected: pinning to the 3.x line already
installed. Why: `@vitest/coverage-v8` must match the runner's major, and a
project this young should not start a major version behind.

**Replay frames** — recorded per executed instruction, opt-in via
`execute(words, { frames: true })`, capped at `MAX_FRAMES = 2_000` independently
of the cycle cap. Rejected: always recording; capping frames at `MAX_CYCLES`.
Why: server-side verification needs only the final grid and the cycle count and
should not pay to build a replay nobody watches; and a shared cap would let a
runaway program allocate 100,000 snapshots. Teaching programs run to tens or low
hundreds of cycles, so the ceiling is invisible in normal use.

**Command-line runner** — `npm run draw`, with `tsx` as a dev dependency.
Rejected: switching every import to `.ts` specifiers so Node could run the
source directly with no dependency at all. Why: Node's type stripping does not
resolve `.js` specifiers to `.ts` files, so running natively would mean
`allowImportingTsExtensions` across the whole source, and how Next's resolver
handles that at P0 is unverified. One dev-only dependency is the cheaper trade
than planting an unknown in the phase the plan exists to de-risk.

**Example programs** — `examples/*.asm`, asserted against their pictures in the
suite. Rejected: keeping example code in the README only. Why: examples are
documentation, and untested documentation drifts; holding them to their output
means a broken example fails CI rather than misleading a reader.

**Containerised development** — a `node:24-slim` image with `node_modules` in a
named Docker volume, source bind-mounted. Rejected: Alpine; running as root;
letting the bind mount carry `node_modules`. Why: npm installs and executes
third-party lifecycle scripts, and a container is where that should happen
rather than on the host. Debian slim because esbuild and rolldown ship prebuilt
binaries per libc and glibc is the better-trodden path. The named volume is not
optional — bind-mounting the project over `/app` would otherwise shadow the
container's linux binaries with the host's darwin ones.

The trade is a stale-dependency footgun: the volume survives rebuilds, so
changing `package.json` needs `docker compose down -v` before the new packages
appear. Documented in the README rather than solved, because the alternatives
(reinstalling on every run, or no volume at all) cost more than the note does.

**FILL unrolls; only REPEAT loops** — `FILL n` emits n `STORE`/`ADDI` pairs
rather than a counted loop. Rejected: compiling FILL to a loop for symmetry with
REPEAT. Why: unrolling is fewer instructions *and* fewer cycles than a counted
loop, needs no counter register, and leaves REPEAT as the only construct in the
output producing a `JNZ`. That sharpens the reveal the whole curriculum builds
to instead of muddying it with loops the learner did not write.

**Compile-time cursor tracking** — the compiler tracks the pen position and
emits `ROW` as a single `ADDI`. Rejected: maintaining a column register at
runtime; computing the row boundary with repeated subtraction. Why: `ROW` must
advance `8 - (pos mod 8)` cells and the machine has no division, but every count
in Blocks is a literal so the position is always known. Inside a `REPEAT` this
holds only when the body's net displacement is a whole number of rows;
otherwise the compiler rejects the program rather than emitting code that moves
a different distance on each pass.

**REPEAT nesting limited to two levels** — bounded by the spare registers `R1`
and `R3`. Rejected: unrolling inner loops once registers run out. Why: a clear
compile error beats silently changing the shape of the output a learner is
being taught to read. Revisit if a lesson genuinely needs three levels.

**Disassembler** — `disassemble.ts`, beyond the original P1 plan. Why: the
compiler's output is the teaching artefact, so being unable to show it made the
compiler only half-useful. Its test asserts the output re-parses to the
instructions it came from, which catches operand-order mistakes that a
golden-string test would not.

**Blocks parsing in its own module** — `blocks.ts` rather than inside
`parse.ts`, revising `machine.md` §9. Rejected: one parser file for both
languages. Why: two grammars in one file would make it the largest module in
the project and blur which language an error belongs to.

**Daily puzzles generate Blocks, not assembly** — the generator builds a random
Blocks program, compiles it, and runs it. Rejected: generating random assembly.
Why: random assembly mostly faults or draws nothing, so candidates would be
valid by luck; Blocks always terminates and always produces picture-like output,
making every candidate valid by construction. Par is then the compiled
program's cycle count — an honest upper bound, since compiled Blocks is not
optimal and a hand-written assembly solution can beat it.

**Puzzle variety comes from the period** — how many rows pass before the picture
repeats, drawn from 2, 3, 4 or 8. Rejected: the first implementation, which only
used periods 2 and 3. Why: every puzzle came out as horizontal banding — the
grids differed but the *kind* of picture never did, so a week of dailies would
look identical. Caught by inspecting real output rather than by the suite, which
only asserted the quality gate; a variety test now guards it.

**Gate exhaustion returns the best attempt** — after 50 rejected rolls the last
candidate is returned anyway. Rejected: widening the gate, or failing outright.
Why: a dull puzzle beats no puzzle, and the gate expresses a preference rather
than a correctness requirement. No date in 500 has needed it.
