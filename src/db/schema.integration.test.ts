import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { db } from ".";
import { assignments, logs, users, workouts } from "./schema";

// Postgres error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const CHECK_VIOLATION = "23514";
const INVALID_TEXT_REPRESENTATION = "22P02";

// Drizzle wraps the driver's error; Postgres's code and constraint are on `cause`.
function pgError(code: string, constraint?: string) {
  return { cause: { code, ...(constraint && { constraint }) } };
}

// Every test starts from empty tables.
beforeEach(async () => {
  await db.execute(
    sql`truncate users, sessions, accounts, verifications, workouts, assignments, logs restart identity cascade`,
  );
});

afterAll(() => db.$client.end());

// A coach, an athlete, one workout, and one assignment of it.
async function seedAssignment() {
  const [coach] = await db
    .insert(users)
    .values({ name: "Coach", email: "coach@example.com", role: "coach" })
    .returning();
  const [athlete] = await db
    .insert(users)
    .values({ name: "Athlete", email: "athlete@example.com" })
    .returning();
  const [workout] = await db
    .insert(workouts)
    .values({ coachId: coach.id, title: "5x5 squat" })
    .returning();
  const [assignment] = await db
    .insert(assignments)
    .values({ workoutId: workout.id, athleteId: athlete.id })
    .returning();
  return { coach, athlete, workout, assignment };
}

describe("users", () => {
  test("rejects a duplicate email", async () => {
    await db.insert(users).values({ name: "A", email: "a@example.com" });

    await expect(
      db.insert(users).values({ name: "A", email: "a@example.com" }),
    ).rejects.toMatchObject(pgError(UNIQUE_VIOLATION, "users_email_unique"));
  });

  test("rejects a role outside the enum", async () => {
    // TypeScript already blocks this; the cast checks the database does too.
    const role = "parent" as "coach";

    await expect(
      db.insert(users).values({ name: "A", email: "a@example.com", role }),
    ).rejects.toMatchObject(pgError(INVALID_TEXT_REPRESENTATION));
  });
});

describe("logs", () => {
  test.each([
    ["sets", "logs_sets_nonnegative"],
    ["reps", "logs_reps_nonnegative"],
    ["durationSeconds", "logs_duration_nonnegative"],
  ] as const)("rejects negative %s", async (field, constraint) => {
    const { assignment } = await seedAssignment();

    await expect(
      db.insert(logs).values({ assignmentId: assignment.id, [field]: -1 }),
    ).rejects.toMatchObject(pgError(CHECK_VIOLATION, constraint));
  });

  test("rejects a second log for the same assignment", async () => {
    const { assignment } = await seedAssignment();
    await db.insert(logs).values({ assignmentId: assignment.id, reps: 5 });

    await expect(
      db.insert(logs).values({ assignmentId: assignment.id, reps: 5 }),
    ).rejects.toMatchObject(
      pgError(UNIQUE_VIOLATION, "logs_assignment_id_unique"),
    );
  });
});

describe("deletes", () => {
  test("blocks deleting a workout that has been assigned", async () => {
    const { workout } = await seedAssignment();

    await expect(
      db.delete(workouts).where(eq(workouts.id, workout.id)),
    ).rejects.toMatchObject(
      pgError(FOREIGN_KEY_VIOLATION, "assignments_workout_id_workouts_id_fk"),
    );
  });

  test("deleting an assignment deletes its log", async () => {
    const { assignment } = await seedAssignment();
    await db.insert(logs).values({ assignmentId: assignment.id, reps: 5 });

    await db.delete(assignments).where(eq(assignments.id, assignment.id));

    expect(await db.select().from(logs)).toEqual([]);
  });
});
