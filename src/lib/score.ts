/**
 * How well a solution did, out of 100.
 *
 * Scored on **commands written**, not cycles executed. The original workshop
 * scored this way and it is what a beginner already means by "steps": the size
 * of the program you wrote, not the work the machine did running it.
 *
 * Matching par is full marks. Beating par is still full marks — par is a
 * reference solution, not a proven optimum, so exceeding it should feel like
 * success rather than produce a number above 100. Rankings use the raw command
 * count, which has no ceiling; this score is for the learner, not the table.
 */
export function score(used: number, par: number): number {
  if (used <= 0 || par <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((par / used) * 100)));
}
