"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { assignments, users, workouts } from "@/db/schema";
import { fields, type FormState } from "@/lib/forms";
import { requireRole } from "@/lib/require-role";

const workoutSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a title")
    .max(100, "Keep it under 100 characters"),
  // Optional: an empty textarea is stored as null, not "".
  description: z
    .string()
    .trim()
    .max(1000, "Keep it under 1000 characters")
    .transform((value) => value || null),
});

const assignSchema = z.object({
  athleteId: z.string().min(1, "Choose an athlete"),
  // <input type="date"> sends "YYYY-MM-DD", or "" when left blank.
  dueDate: z
    .union([z.iso.date("Enter a valid date"), z.literal("")])
    .transform((value) => value || null),
});

export async function createWorkout(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("coach");

  const values = fields(formData, ["title", "description"]);
  const parsed = workoutSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const [workout] = await db
    .insert(workouts)
    .values({ ...parsed.data, coachId: session.user.id })
    .returning({ id: workouts.id });

  revalidatePath("/coach");
  redirect(`/coach/workouts/${workout.id}`);
}

// workoutId is bound on the page: assignWorkout.bind(null, workout.id).
// Bound arguments travel through the browser and can be tampered with,
// so the ownership check below matters.
export async function assignWorkout(
  workoutId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("coach");

  const values = fields(formData, ["athleteId", "dueDate"]);
  const parsed = assignSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const [workout] = await db
    .select({ id: workouts.id })
    .from(workouts)
    .where(
      and(eq(workouts.id, workoutId), eq(workouts.coachId, session.user.id)),
    );
  if (!workout) return { error: "Workout not found", values };

  // The database only checks that the user exists, not that they're an athlete.
  const [athlete] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, parsed.data.athleteId), eq(users.role, "athlete")));
  if (!athlete) {
    return { fieldErrors: { athleteId: ["Choose an athlete"] }, values };
  }

  await db.insert(assignments).values({ workoutId, ...parsed.data });

  revalidatePath(`/coach/workouts/${workoutId}`);
  return {};
}
