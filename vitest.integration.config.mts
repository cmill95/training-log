import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.integration.test.ts"],
    globalSetup: ["./src/test/migrate-test-db.ts"],
    // Set before any test file imports src/db, so `db` connects here, not to Neon.
    env: {
      DATABASE_URL:
        "postgres://postgres:postgres@localhost:5433/training_log_test",
    },
    // Test files share one database; running them in parallel would let one
    // file's cleanup delete another file's rows.
    fileParallelism: false,
  },
});
