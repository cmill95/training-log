import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve the "@/..." imports from tsconfig.json, as Next.js does.
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.integration.test.ts"],
    globalSetup: ["./src/test/migrate-test-db.ts"],
    setupFiles: ["./src/test/setup-next-mocks.ts"],
    // Set before any test file imports src/db, so `db` connects here, not to Neon.
    env: {
      DATABASE_URL:
        "postgres://postgres:postgres@localhost:5433/training_log_test",
      // Test-only values; the real secret lives in .env.local and Vercel.
      BETTER_AUTH_SECRET: "test-secret-not-used-anywhere-real-0123456789",
      BETTER_AUTH_URL: "http://localhost:3000",
    },
    // Test files share one database; running them in parallel would let one
    // file's cleanup delete another file's rows.
    fileParallelism: false,
  },
});
