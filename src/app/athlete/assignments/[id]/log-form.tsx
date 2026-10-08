"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { logWorkout } from "../../actions";

export function LogForm({ assignmentId }: { assignmentId: number }) {
  const [state, formAction, pending] = useActionState(
    logWorkout.bind(null, assignmentId),
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        Fill in what applies; everything is optional.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Field
          label="Sets"
          name="sets"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          defaultValue={state.values?.sets}
          errors={state.fieldErrors?.sets}
        />
        <Field
          label="Reps"
          name="reps"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          defaultValue={state.values?.reps}
          errors={state.fieldErrors?.reps}
        />
        <Field
          label="Minutes"
          name="minutes"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          defaultValue={state.values?.minutes}
          errors={state.fieldErrors?.minutes}
        />
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Notes
        <textarea
          name="notes"
          rows={3}
          maxLength={1000}
          defaultValue={state.values?.notes}
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-base font-normal dark:border-zinc-700"
        />
        {state.fieldErrors?.notes && (
          <span className="text-red-600 dark:text-red-400">
            {state.fieldErrors.notes.join(" ")}
          </span>
        )}
      </label>
      <p aria-live="polite" className="text-sm text-red-600 dark:text-red-400">
        {state.error}
      </p>
      <button
        disabled={pending}
        className="self-start rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "Saving…" : "Log workout"}
      </button>
    </form>
  );
}
