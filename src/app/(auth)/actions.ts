"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { roleEnum } from "@/db/schema";
import { auth } from "@/lib/auth";
import { fields, type FormState } from "@/lib/forms";

// Sign-up and sign-in are the exception to "check the session first":
// the user has no session yet. Zod still checks the input.

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  email: z.email("Enter a valid email"),
  // Better Auth's default minimum; checking here gives a message on the field.
  password: z.string().min(8, "Use at least 8 characters"),
  role: z.enum(roleEnum.enumValues, "Choose coach or athlete"),
});

const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = fields(formData, ["name", "email", "role"]);
  const parsed = signUpSchema.safeParse({
    ...values,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  try {
    // Signs the user in too; nextCookies() sets the session cookie.
    await auth.api.signUpEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    // APIError is an expected failure (e.g. email taken): show its message.
    // Anything else is a bug and goes to the error page.
    if (error instanceof APIError) return { error: error.message, values };
    throw error;
  }
  // redirect() works by throwing, so it must stay outside the try/catch.
  redirect("/");
}

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = fields(formData, ["email"]);
  const parsed = signInSchema.safeParse({
    ...values,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    // Better Auth says "Invalid email or password" without saying which,
    // so the message doesn't reveal whether an email has an account.
    if (error instanceof APIError) return { error: error.message, values };
    throw error;
  }
  redirect("/");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
