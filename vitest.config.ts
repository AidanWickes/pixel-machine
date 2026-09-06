import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // A runaway program is a synchronous loop, which no timeout can interrupt.
    // The cycle cap is the real defence; this only bounds the damage in CI.
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      include: ['src/lib/machine/**/*.ts'],
      reporter: ['text-summary'],
      // The machine is pure logic the leaderboard's honesty depends on.
      // Earlier in this project untested guards sat in execute.ts while the
      // suite stayed green; this gate is what makes that visible.
      thresholds: { lines: 95, branches: 90, functions: 100, statements: 95 },
    },
  },
});
