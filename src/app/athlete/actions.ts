"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { assignments, logs } from "@/db/schema";
import { fields, type FormState } from "@/lib/forms";
import { requireRole } from "@/lib/require-role";

// A blank number input sends ""; treat that as "not recorded".
const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

const count = z.preprocess(
  blankToUndefined,
  z.coerce
    .number("Enter a number")
    .int("Use a whole number")
    .min(0, "Can't be negative")
    .optional(),
);

const logSchema = z.object({
  sets: count,
  reps: count,
  // Entered in minutes (decimals allowed), stored in seconds.
  minutes: z.preprocess(
    blankToUndefined,
    z.coerce
      .number("Enter a number")
      .min(0, "Can't be negative")
      .max(24 * 60, "That's more than a day")
      .optional(),
  ),
  notes: z
    .string()
    .trim()
    .max(1000, "Keep it under 1000 characters")
    .transform((value) => value || null),
});

// assignmentId is bound on the page and passes through the browser, so the
// query below only finds it if it belongs to the signed-in athlete.
export async function logWorkout(
  assignmentId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("athlete");

  const values = fields(formData, ["sets", "reps", "minutes", "notes"]);
  const parsed = logSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const [assignment] = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(
      and(
        eq(assignments.id, assignmentId),
        eq(assignments.athleteId, session.user.id),
      ),
    );
  if (!assignment) return { error: "Assignment not found", values };

  const { sets, reps, minutes, notes } = parsed.data;
  // logs.assignment_id is unique (one log per assignment). onConflictDoNothing
  // turns a second log into "no row inserted" instead of a database error.
  const inserted = await db
    .insert(logs)
    .values({
      assignmentId,
      sets: sets ?? null,
      reps: reps ?? null,
      durationSeconds: minutes === undefined ? null : Math.round(minutes * 60),
      notes,
    })
    .onConflictDoNothing()
    .returning({ id: logs.id });
  if (inserted.length === 0) {
    return { error: "You've already logged this workout", values };
  }

  revalidatePath(`/athlete/assignments/${assignmentId}`);
  return {};
}
