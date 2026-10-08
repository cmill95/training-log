import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { roleEnum } from "../db/schema";
import { auth } from "./auth";

type Role = (typeof roleEnum.enumValues)[number];

// The first call in every coach or athlete page and server action.
// Returns the session so the caller knows who the user is.
export async function requireRole(role: Role) {
  const session = await auth.api.getSession({ headers: await headers() });
  // redirect() throws, so TypeScript knows `session` isn't null after this.
  if (!session) redirect("/sign-in");
  if (session.user.role !== role) redirect("/");
  return session;
}
