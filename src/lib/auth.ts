import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { z } from "zod";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  // usePlural: Better Auth's "user" model is our `users` table, and so on.
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      // Chosen at sign-up for the MVP, so anyone can claim "coach".
      role: {
        type: ["coach", "athlete"],
        required: true,
        defaultValue: "athlete",
        // Better Auth doesn't check enum values on its own; without this, a bad
        // role only fails at the database, as a server error.
        validator: { input: z.enum(["coach", "athlete"]) },
      },
    },
  },
  // Lets server actions that sign in or out set the session cookie.
  // Must stay the last plugin.
  plugins: [nextCookies()],
});
