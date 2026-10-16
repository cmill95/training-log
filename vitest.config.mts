import { defineConfig } from "vitest/config";

// Unit tests: pure logic, no database, so they're fast enough for the
// pre-commit hook. Database tests live in vitest.integration.config.mts.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.integration.test.ts"],
  },
});
