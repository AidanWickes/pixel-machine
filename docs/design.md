# Pixel Machine — design

The look, the vision, and the rules that keep both consistent. Written before
the build so that decisions are made once, in one place, rather than
re-litigated per component.

---

## 1 · Vision

**Pixel Machine teaches assembly language by making it draw.**

You write instructions for a small, complete, comprehensible computer. It has
four registers, a program counter, and an 8×8 screen wired directly into its
memory. Every instruction you write moves a real value into a real place, and
the screen shows you the consequence immediately.

The bet: assembly is not hard because it is complex — it is hard because it is
invisible. Nothing happens that you can see. Wire the memory to a screen, and
suddenly `STORE R2, [R0]` is not an abstraction. It is a pixel going blue.

**Primary audience:** public learners on the internet who want to understand
what is actually happening underneath the languages they already use.

**Promise:** in twenty minutes you will have written a program with no
variables, no functions, and no loops — only registers and jumps — and it will
have drawn something.

**Not the promise:** professional 6502 or ARM proficiency. This is a real
machine, but a deliberately small and fictional one. Transferable concepts,
not a transferable instruction set.

---

## 2 · Product principles

1. **The machine is visible at all times.** Registers, program counter, cycle
   count and video RAM are permanent interface, not a debug panel you open.
   If the user cannot see the state change, the lesson has not landed.
2. **Immediate consequence.** Every edit re-runs locally. No compile step, no
   waiting, no server round trip to find out you were wrong.
3. **Honest difficulty.** Some things genuinely do not compress. The original
   workshop had a "Steps" target whose lesson was that no loop helps you — that
   honesty is kept. Puzzles that teach a limitation are as valuable as puzzles
   that teach a technique.
4. **Playable before it is personal.** Lesson one runs with no account. The
   signup prompt arrives after value has been delivered, never before.
5. **The artwork owns the colour.** Interface chrome never uses a pixel ink.
   See §4.

---

## 3 · The look — "machine room"

Warm paper ground, ink-black type, mechanical detailing, museum-panel clarity.
Early-computing **print**, not early-computing screen.

**The anti-goal is the CRT cliché.** Green phosphor, scanlines, flicker and
terminal-glow are the default costume for anything involving assembly, and
they are exhausted. They also actively harm legibility in a product where
users read hex columns for twenty minutes at a stretch.

The reference points instead are punch cards, line-printer output, engineering
schematics, and the industrial design of the machines themselves — Olivetti
and IBM rather than Hollywood hacker. Paper stock, precise rules, mechanical
labelling, generous margins. The 8×8 grid reads as a printed swatch card.

Corners are sharp or nearly so (2px maximum). Nothing is a pill. Nothing
glows. Shadows are minimal and hard-edged where used at all — this is an
object made of metal and paper, not glass.

---

## 4 · Colour

### The reserved-ink rule

The three pixel colours — blue, red, yellow — **belong to the grid and to
nothing else**. No button, link, badge, focus ring, or chart may use them.

This is the single most important visual constraint in the product. The user's
job is to match colours on a grid. Any interface element sharing those colours
competes with the task and creates false signal. Chrome gets ink, paper, and
one muted accent.

The inks render as true primaries. The original workshop used `B` as a solid
dark; rendering it as blue makes the set read as primary printing inks and
gives the grid far more life.

### Tokens — light (default)

```
--paper           #F5F2EA   page ground, warm
--paper-raised    #FFFDF7   panels, editor surface
--paper-sunken    #EAE5D9   wells, empty grid cells, code gutters
--ink             #1B1917   body and heading text
--ink-muted       #5C564D   secondary text, labels
--ink-faint       #8A8377   decorative and large text only — not body copy
--rule            #D8D2C4   hairlines, borders, grid lines
--accent          #2E5D57   muted machine teal — buttons, focus, active state
--on-accent       #FFFDF7
--ok              #3F7A42   success, matched target
--warn            #9A6114   caution, off-grid warning
```

### Tokens — dark ("machine room at night")

```
--paper           #171614
--paper-raised    #1F1E1B
--paper-sunken    #100F0E
--ink             #EDE8DC
--ink-muted       #A29B8C
--ink-faint       #6E6759   decorative only
--rule            #322F2A
--accent          #5FB3A6
--on-accent       #10201E
--ok              #6FB874
--warn            #D19A3C
```

### Pixel inks

```
           light      dark
--px-b     #2D5BD7    #5B85E8
--px-r     #D3352A    #E8564A
--px-y     #EFC02E    #F2CD5C
--px-off   var(--paper-sunken)
```

Dark-theme inks are lifted and slightly desaturated so they sit on a dark
ground without vibrating.

**Contrast is a target, not yet a measurement.** Every pairing must clear WCAG
AA in both themes; `--ink-faint` is expected to fail for body copy and is
restricted to large or decorative text. Verify the full matrix at P0 and record
the result — do not assume these values pass.

---

## 5 · Typography

**IBM Plex Sans** for interface, **IBM Plex Mono** for all code, registers, hex
and cycle counts. Two families, nothing else.

Chosen because IBM built the machines this teaches, which makes it the rare
type decision with a real answer behind it rather than a preference. Both are
open source.

**Self-hosted, always.** The original build's only network dependency was
Google Fonts, which meant the page reflowed mid-lesson whenever the connection
died. Subset and serve the woff2 files from the app. No external font
requests.

Mono carries more weight here than in most products — roughly half the screen
is code, addresses and hex at any moment. It must stay legible at 13px, and
`0`/`O` and `1`/`l`/`I` must be unambiguous.

### Scale

```
display   36 / 44   Plex Sans, 600
h1        28 / 34   Plex Sans, 600
h2        22 / 28   Plex Sans, 600
h3        18 / 24   Plex Sans, 600
body      16 / 26   Plex Sans, 400
small     14 / 20   Plex Sans, 400
label     12 / 16   Plex Sans, 500, 0.06em tracking, uppercase
code      14 / 22   Plex Mono, 400
code-sm   13 / 18   Plex Mono, 400
```

Uppercase tracked labels are the mechanical-panel voice. Use them for panel
titles, register names and column headers — never for sentences.

---

## 6 · Space and layout

4px base unit. Scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`.

Radius: `0` structural, `2px` controls. Nothing larger.

### The play surface

Three regions, always visible together on desktop:

```
┌─────────────────┬───────────────────┬──────────────┐
│  Lesson / brief │   Grid            │  Machine     │
│  + target       │   (current)       │  inspector   │
├─────────────────┤                   │  R0 R1 R2 R3 │
│  Editor         │   Transport       │  PC · cycles │
│  (source)       │   ◀ ▮ ▶ ── scrub  │              │
└─────────────────┴───────────────────┴──────────────┘
```

Grid cells are 32px with a 2px gap on desktop (a 270px board); target previews
use 12px cells. Below 900px the inspector collapses beneath the grid; below
600px the editor and grid stack, and the inspector becomes a compact single
row. The inspector is never removed entirely — see principle 1.

---

## 7 · Motion

The step animation is the signature interaction: the program counter advances,
a register ticks, a pixel lands. It is the product's core explanatory device
and deserves care.

- Step cadence is user-controlled via the transport, with a scrubber over the
  recorded frames.
- Transitions are short and mechanical: 120ms, ease-out. Nothing bounces.
- The pixel that just changed gets a one-frame highlight, then settles.
- `prefers-reduced-motion` disables animated playback entirely and jumps
  straight to the final frame; the scrubber still works, driven manually.

---

## 8 · Components

Atoms, molecules and organisms are real directories. Templates and pages are
the App Router's job, and duplicating them as folders would create structure
that exists only to complete a diagram.

**Atoms** — `Button` · `Input` · `Label` · `Badge` · `Chip` · `Pixel` · `Text`
· `Rule` · `Icon`

**Molecules** — `FormField` (label + input + error) · `RegisterReadout` (name,
value, bar) · `InstructionRow` (address, mnemonic, encoded word) ·
`ScoreRow` (rank, name, cycles) · `CycleCounter` · `LessonNav` · `ThemeToggle`

**Organisms** — `CodeEditor` · `PixelGrid` (current, target, diff overlay) ·
`MachineInspector` · `Transport` · `LeaderboardTable` · `LessonPane` ·
`AuthForm` · `PuzzleHeader`

`PixelGrid` and `MachineInspector` are the two components worth designing
properly and building slowly. Everything else is ordinary.

---

## 9 · Accessibility

Non-negotiable, and unusually load-bearing here: this is a colour-matching
game, so colour-only differentiation would exclude colourblind users from the
entire product rather than from a detail of it.

- **Pixel texture.** Each ink has an optional pattern — solid, hatch, dots —
  echoing the `█ ▓ ▒` characters the original terminal version used. Toggle in
  settings, persisted. This is a correctness feature, not an accommodation.
- Every pixel cell carries an accessible name giving its colour by word.
- AA contrast on all text in both themes, verified and recorded at P0.
- Visible focus everywhere, using `--accent`, never colour alone.
- The editor is keyboard-first; the transport is fully keyboard-operable.
- `prefers-reduced-motion` honoured (§7).
- Errors are announced, not merely coloured red.

---

## 10 · StyleX conventions

- Tokens live in `src/styles/tokens.stylex.ts` via `stylex.defineVars`. The
  dark theme is a `stylex.createTheme` override of the same variable group.
- **Semantic names only.** `--paper-raised`, never `--cream-100`. A component
  never learns a literal colour.
- No raw hex outside `tokens.stylex.ts`. This is checkable, and should be
  checked in CI.
- Styles are colocated with their component in the same file.
- `useCSSLayers: true` in the plugin config, so cascade order stays
  predictable.
- Variants are props mapping to style objects, never conditional class strings.

The same semantic-token discipline as the kart tracker, deliberately — two
case studies sharing a method reads as an approach rather than a coincidence.
