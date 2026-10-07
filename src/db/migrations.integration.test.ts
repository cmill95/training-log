import { sql } from "drizzle-orm";
import { afterAll, expect, test } from "vitest";
import { db } from ".";

afterAll(() => db.$client.end());

test("migrations create every table", async () => {
  const result = await db.execute<{ table_name: string }>(sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `);
  expect(result.rows.map((r) => r.table_name)).toEqual([
    "accounts",
    "assignments",
    "logs",
    "sessions",
    "users",
    "verifications",
    "workouts",
  ]);
});
