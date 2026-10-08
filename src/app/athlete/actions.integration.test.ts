import { sql } from "drizzle-orm";
import { afterAll, beforeEach, expect, test } from "vitest";
import { db } from "@/db";
import { assignments, logs, workouts } from "@/db/schema";
import { redirectTo, signInAs } from "@/test/next-request";
import { logWorkout } from "./actions";

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

const blank = { sets: "", reps: "", minutes: "", notes: "" };

// A coach's workout assigned to the given athlete. Leaves the athlete signed in.
async function assignTo(athleteEmail: string) {
  const coach = await signInAs("coach");
  const athlete = await signInAs("athlete", athleteEmail);
  const [workout] = await db
    .insert(workouts)
    .values({ coachId: coach.id, title: "Intervals" })
    .returning();
  const [assignment] = await db
    .insert(assignments)
    .values({ workoutId: workout.id, athleteId: athlete.id })
    .returning();
  return assignment;
}

test("logWorkout saves the log, converting minutes to seconds", async () => {
  const assignment = await assignTo("athlete@example.com");

  const state = await logWorkout(
    assignment.id,
    {},
    form({ ...blank, sets: "3", minutes: "12.5", notes: " felt good " }),
  );

  expect(state).toEqual({});
  expect(await db.select().from(logs)).toMatchObject([
    {
      assignmentId: assignment.id,
      sets: 3,
      reps: null,
      durationSeconds: 750,
      notes: "felt good",
    },
  ]);
});

test("an athlete can't log someone else's assignment", async () => {
  const assignment = await assignTo("owner@example.com");
  await signInAs("athlete", "other@example.com");

  const state = await logWorkout(assignment.id, {}, form(blank));

  expect(state.error).toBe("Assignment not found");
  expect(await db.select().from(logs)).toEqual([]);
});

test("a second log for the same assignment is refused", async () => {
  const assignment = await assignTo("athlete@example.com");
  await logWorkout(assignment.id, {}, form({ ...blank, sets: "3" }));

  const state = await logWorkout(
    assignment.id,
    {},
    form({ ...blank, sets: "5" }),
  );

  expect(state.error).toBe("You've already logged this workout");
  expect(await db.select().from(logs)).toMatchObject([{ sets: 3 }]);
});

test("rejects negative and non-whole numbers", async () => {
  const assignment = await assignTo("athlete@example.com");

  const state = await logWorkout(
    assignment.id,
    {},
    form({ ...blank, sets: "2.5", reps: "-1", minutes: "abc" }),
  );

  expect(state.fieldErrors).toMatchObject({
    sets: ["Use a whole number"],
    reps: ["Can't be negative"],
    minutes: ["Enter a number"],
  });
  expect(await db.select().from(logs)).toEqual([]);
});

test("logWorkout is athlete-only", async () => {
  const assignment = await assignTo("athlete@example.com");
  await signInAs("coach", "coach2@example.com");

  await expect(
    logWorkout(assignment.id, {}, form(blank)),
  ).rejects.toMatchObject(redirectTo("/"));
  expect(await db.select().from(logs)).toEqual([]);
});
