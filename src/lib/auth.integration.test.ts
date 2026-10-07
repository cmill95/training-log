import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, expect, test } from "vitest";
import { db } from "../db";
import { accounts, users } from "../db/schema";
import { auth } from "./auth";

const password = "correct horse battery";

beforeEach(async () => {
  await db.execute(
    sql`truncate users, sessions, accounts, verifications restart identity cascade`,
  );
});

afterAll(() => db.$client.end());

function signUp(email: string, role?: "coach" | "athlete") {
  return auth.api.signUpEmail({
    body: { name: "Test", email, password, ...(role && { role }) },
  });
}

test("sign-up stores the role and a hashed password", async () => {
  const { user } = await signUp("coach@example.com", "coach");

  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  expect(row.role).toBe("coach");

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, user.id));
  expect(account.providerId).toBe("credential");
  expect(account.password).toBeTruthy();
  expect(account.password).not.toContain(password);
});

test("role defaults to athlete", async () => {
  const { user } = await signUp("athlete@example.com");

  expect(user.role).toBe("athlete");
});

test("rejects a role outside coach/athlete as bad input", async () => {
  const role = "admin" as "coach";

  // 400 means Better Auth's validator caught it, not the database enum.
  await expect(signUp("x@example.com", role)).rejects.toMatchObject({
    statusCode: 400,
  });
  expect(await db.select().from(users)).toEqual([]);
});

test("sign-in works with the right password only", async () => {
  await signUp("coach@example.com", "coach");

  const ok = await auth.api.signInEmail({
    body: { email: "coach@example.com", password },
  });
  expect(ok.user.email).toBe("coach@example.com");

  await expect(
    auth.api.signInEmail({
      body: { email: "coach@example.com", password: "wrong password" },
    }),
  ).rejects.toThrow();
});
