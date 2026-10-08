"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { assignWorkout } from "../../actions";

export function AssignForm({
  workoutId,
  athletes,
}: {
  workoutId: number;
  athletes: { id: string; name: string; email: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    assignWorkout.bind(null, workoutId),
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Athlete
        {/* key: remount after each submit so defaultValue applies again. */}
        <select
          key={state.values?.athleteId}
          name="athleteId"
          required
          defaultValue={state.values?.athleteId ?? ""}
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-base font-normal dark:border-zinc-700"
        >
          <option value="" disabled>
            Choose an athlete
          </option>
          {athletes.map((athlete) => (
            <option key={athlete.id} value={athlete.id}>
              {athlete.name} ({athlete.email})
            </option>
          ))}
        </select>
        {state.fieldErrors?.athleteId && (
          <span className="text-red-600 dark:text-red-400">
            {state.fieldErrors.athleteId.join(" ")}
          </span>
        )}
      </label>
      <Field
        label="Due date (optional)"
        name="dueDate"
        type="date"
        defaultValue={state.values?.dueDate}
        errors={state.fieldErrors?.dueDate}
      />
      <p aria-live="polite" className="text-sm text-red-600 dark:text-red-400">
        {state.error}
      </p>
      <button
        disabled={pending}
        className="self-start rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "Assigning…" : "Assign"}
      </button>
    </form>
  );
}
