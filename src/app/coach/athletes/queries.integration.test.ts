import { sql } from "drizzle-orm";
import { afterAll, beforeEach, expect, test } from "vitest";
import { db } from "@/db";
import { assignments, logs, workouts } from "@/db/schema";
import { signInAs } from "@/test/next-request";
import { coachAssignments } from "./queries";

beforeEach(async () => {
  await db.execute(
    sql`truncate users, sessions, accounts, verifications restart identity cascade`,
  );
});

afterAll(() => db.$client.end());

async function assign(coachId: string, athleteId: string, title: string) {
  const [workout] = await db
    .insert(workouts)
    .values({ coachId, title })
    .returning();
  const [assignment] = await db
    .insert(assignments)
    .values({ workoutId: workout.id, athleteId })
    .returning();
  return assignment;
}

test("coachAssignments only returns the coach's own workouts", async () => {
  const athlete = await signInAs("athlete");
  const coach = await signInAs("coach", "coach@example.com");
  const otherCoach = await signInAs("coach", "other@example.com");
  await assign(coach.id, athlete.id, "Mine");
  await assign(otherCoach.id, athlete.id, "Theirs");

  const rows = await coachAssignments(coach.id, athlete.id);

  expect(rows.map((row) => row.title)).toEqual(["Mine"]);
});

test("coachAssignments filters by athlete and includes the log", async () => {
  const athlete = await signInAs("athlete", "athlete@example.com");
  const otherAthlete = await signInAs("athlete", "other@example.com");
  const coach = await signInAs("coach");
  const logged = await assign(coach.id, athlete.id, "Logged");
  await assign(coach.id, athlete.id, "Open");
  await assign(coach.id, otherAthlete.id, "Someone else's");
  await db.insert(logs).values({ assignmentId: logged.id, reps: 10 });

  const rows = await coachAssignments(coach.id, athlete.id);

  expect(rows).toHaveLength(2);
  expect(rows).toContainEqual(
    expect.objectContaining({ title: "Logged", reps: 10 }),
  );
  expect(rows).toContainEqual(
    expect.objectContaining({ title: "Open", loggedAt: null }),
  );
  expect(await coachAssignments(coach.id)).toHaveLength(3);
});
