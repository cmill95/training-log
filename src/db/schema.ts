import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["coach", "athlete"]);

export const users = pgTable("users", {
  // Text, not integer: auth libraries use string user IDs.
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  name: text("name"),
  email: text("email").notNull().unique(),
  image: text("image"),
  role: roleEnum("role").notNull().default("athlete"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workouts = pgTable(
  "workouts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    coachId: text("coach_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("workouts_coach_id_idx").on(t.coachId)],
);

// No status column: completed = a log exists, overdue = past due_date with no log.
export const assignments = pgTable(
  "assignments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    // Restrict: deleting a workout that has been assigned would erase athlete history.
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "restrict" }),
    athleteId: text("athlete_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dueDate: date("due_date"),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("assignments_workout_id_idx").on(t.workoutId),
    index("assignments_athlete_id_idx").on(t.athleteId),
  ],
);

export const logs = pgTable(
  "logs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    // Unique: at most one log per assignment (also gives this column an index).
    assignmentId: integer("assignment_id")
      .notNull()
      .unique()
      .references(() => assignments.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    sets: integer("sets"),
    reps: integer("reps"),
    durationSeconds: integer("duration_seconds"),
    notes: text("notes"),
  },
  (t) => [
    check("logs_sets_nonnegative", sql`${t.sets} >= 0`),
    check("logs_reps_nonnegative", sql`${t.reps} >= 0`),
    check("logs_duration_nonnegative", sql`${t.durationSeconds} >= 0`),
  ],
);
