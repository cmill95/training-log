import { expect } from "vitest";
import { auth } from "../lib/auth";

// The headers of the current fake request; see setup-next-mocks.ts.
export const testRequest = { headers: new Headers() };

// Signs up a user and makes the following "requests" come from them.
export async function signInAs(
  role: "coach" | "athlete",
  email = `${role}@example.com`,
) {
  const { headers, response } = await auth.api.signUpEmail({
    body: {
      name: `Test ${role}`,
      email,
      password: "correct horse battery",
      role,
    },
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(";")[0])
    .join("; ");
  testRequest.headers = new Headers({ cookie });
  return response.user;
}

// redirect() throws an error whose digest names the target path.
export function redirectTo(path: string) {
  return { digest: expect.stringContaining(`;${path};`) };
}
