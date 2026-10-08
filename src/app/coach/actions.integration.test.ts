import { sql } from "drizzle-orm";
import { afterAll, beforeEach, expect, test } from "vitest";
import { db } from "@/db";
import { assignments, workouts } from "@/db/schema";
import { redirectTo, signInAs } from "@/test/next-request";
import { assignWorkout, createWorkout } from "./actions";

beforeEach(async () => {
  await db.execute(
    sql`truncate users, sessions, accounts, verifications restart identity cascade`,
  );
});

afterAll(() => db.$client.end());

function form(values: Record<string, string>) {
  const formData = new FormData();
  for (const [name, value] of Object.entries(values)) {
    formData.set(name, value);
  }
  return formData;
}

async function createWorkoutAs(coachEmail: string) {
  const coach = await signInAs("coach", coachEmail);
  const [workout] = await db
    .insert(workouts)
    .values({ coachId: coach.id, title: "Intervals" })
    .returning();
  return workout;
}

test("createWorkout saves the workout and opens it", async () => {
  const coach = await signInAs("coach");

  // "restart identity" in beforeEach makes this the first id.
  await expect(
    createWorkout({}, form({ title: " Intervals ", description: "" })),
  ).rejects.toMatchObject(redirectTo("/coach/workouts/1"));

  expect(await db.select().from(workouts)).toMatchObject([
    { id: 1, coachId: coach.id, title: "Intervals", description: null },
  ]);
});

test("createWorkout rejects a blank title", async () => {
  await signInAs("coach");

  const state = await createWorkout({}, form({ title: "  ", description: "" }));

  expect(state.fieldErrors?.title).toEqual(["Enter a title"]);
  expect(await db.select().from(workouts)).toEqual([]);
});

test("createWorkout is coach-only", async () => {
  await signInAs("athlete");

  await expect(
    createWorkout({}, form({ title: "Intervals", description: "" })),
  ).rejects.toMatchObject(redirectTo("/"));
  expect(await db.select().from(workouts)).toEqual([]);
});

test("assignWorkout assigns to an athlete", async () => {
  const athlete = await signInAs("athlete");
  const workout = await createWorkoutAs("coach@example.com");

  const state = await assignWorkout(
    workout.id,
    {},
    form({ athleteId: athlete.id, dueDate: "2026-10-20" }),
  );

  expect(state).toEqual({});
  expect(await db.select().from(assignments)).toMatchObject([
    { workoutId: workout.id, athleteId: athlete.id, dueDate: "2026-10-20" },
  ]);
});

test("assignWorkout won't assign another coach's workout", async () => {
  const athlete = await signInAs("athlete");
  const workout = await createWorkoutAs("owner@example.com");
  await signInAs("coach", "other@example.com");

  const state = await assignWorkout(
    workout.id,
    {},
    form({ athleteId: athlete.id, dueDate: "" }),
  );

  expect(state.error).toBe("Workout not found");
  expect(await db.select().from(assignments)).toEqual([]);
});

test("assignWorkout only assigns to athletes", async () => {
  const otherCoach = await signInAs("coach", "other@example.com");
  const workout = await createWorkoutAs("coach@example.com");

  const state = await assignWorkout(
    workout.id,
    {},
    form({ athleteId: otherCoach.id, dueDate: "" }),
  );

  expect(state.fieldErrors?.athleteId).toEqual(["Choose an athlete"]);
  expect(await db.select().from(assignments)).toEqual([]);
});

test("assignWorkout rejects a bad due date", async () => {
  const athlete = await signInAs("athlete");
  const workout = await createWorkoutAs("coach@example.com");

  const state = await assignWorkout(
    workout.id,
    {},
    form({ athleteId: athlete.id, dueDate: "next tuesday" }),
  );

  expect(state.fieldErrors?.dueDate).toEqual(["Enter a valid date"]);
  expect(await db.select().from(assignments)).toEqual([]);
});
