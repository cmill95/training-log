"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "../actions";
import { Field } from "../field";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label="Name"
        name="name"
        autoComplete="name"
        required
        defaultValue={state.values?.name}
        errors={state.fieldErrors?.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        errors={state.fieldErrors?.password}
      />

      <fieldset className="flex flex-col gap-1 text-sm font-medium">
        <legend className="mb-1">I am a…</legend>
        {/* key: remount after each submit so defaultChecked applies again. */}
        <div key={state.values?.role} className="flex gap-4 font-normal">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              value="coach"
              required
              defaultChecked={state.values?.role === "coach"}
            />
            Coach
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              value="athlete"
              defaultChecked={state.values?.role === "athlete"}
            />
            Athlete
          </label>
        </div>
        {state.fieldErrors?.role && (
          <span className="text-red-600 dark:text-red-400">
            {state.fieldErrors.role.join(" ")}
          </span>
        )}
      </fieldset>

      <p aria-live="polite" className="text-sm text-red-600 dark:text-red-400">
        {state.error}
      </p>
      <button
        disabled={pending}
        className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
