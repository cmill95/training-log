"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { createWorkout } from "./actions";

export function NewWorkoutForm() {
  const [state, formAction, pending] = useActionState(createWorkout, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label="Title"
        name="title"
        required
        maxLength={100}
        defaultValue={state.values?.title}
        errors={state.fieldErrors?.title}
      />
      <label className="flex flex-col gap-1 text-sm font-medium">
        Description (optional)
        <textarea
          name="description"
          rows={4}
          maxLength={1000}
          defaultValue={state.values?.description}
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-base font-normal dark:border-zinc-700"
        />
        {state.fieldErrors?.description && (
          <span className="text-red-600 dark:text-red-400">
            {state.fieldErrors.description.join(" ")}
          </span>
        )}
      </label>
      <button
        disabled={pending}
        className="self-start rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create workout"}
      </button>
    </form>
  );
}
