import { sql } from "drizzle-orm";
import { afterAll, beforeEach, expect, test } from "vitest";
import { db } from "../db";
import { redirectTo, signInAs } from "../test/next-request";
import { requireRole } from "./require-role";

beforeEach(async () => {
  await db.execute(
    sql`truncate users, sessions, accounts, verifications restart identity cascade`,
  );
});

afterAll(() => db.$client.end());

test("no session redirects to sign-in", async () => {
  await expect(requireRole("coach")).rejects.toMatchObject(
    redirectTo("/sign-in"),
  );
});

test("wrong role redirects home", async () => {
  await signInAs("athlete");

  await expect(requireRole("coach")).rejects.toMatchObject(redirectTo("/"));
});

test("right role returns the session", async () => {
  await signInAs("coach");

  const session = await requireRole("coach");
  expect(session.user).toMatchObject({
    email: "coach@example.com",
    role: "coach",
  });
});
