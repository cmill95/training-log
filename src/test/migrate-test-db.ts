import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { TestProject } from "vitest/node";

// Runs once before all integration tests: applies ./drizzle migrations.
export default async function setup(project: TestProject) {
  const url = project.config.env.DATABASE_URL!;
  // Only the hostname goes in the message: the full URL contains the password.
  const { hostname } = new URL(url);
  if (!/^(localhost|127\.0\.0\.1)$/.test(hostname)) {
    throw new Error(`Refusing to run integration tests against ${hostname}`);
  }
  const db = drizzle(url);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await db.$client.end();
}
