import { sql } from "drizzle-orm";
import { afterAll, beforeEach, expect, test, vi } from "vitest";
import { db } from "../db";
import { auth } from "./auth";
import { requireRole } from "./require-role";

// next/headers only works inside a Next.js request, so the tests supply the
// request headers. vi.hoisted: vi.mock runs before imports, so anything its
// factory uses must be created that early too.
const request = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({
  headers: async () => request.headers,
  cookies: async () => ({ set() {} }),
}));

beforeEach(async () => {
  await db.execute(
    sql`truncate users, sessions, accounts, verifications restart identity cascade`,
  );
  request.headers = new Headers();
});

afterAll(() => db.$client.end());

// Signs up a user and sends their session cookie with the next "request".
async function signInAs(role: "coach" | "athlete") {
  const { headers } = await auth.api.signUpEmail({
    body: {
      name: "Test",
      email: `${role}@example.com`,
      password: "correct horse battery",
      role,
    },
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(";")[0])
    .join("; ");
  request.headers = new Headers({ cookie });
}

// redirect() throws an error whose digest names the target path.
function redirectTo(path: string) {
  return { digest: expect.stringContaining(`;${path};`) };
}

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
