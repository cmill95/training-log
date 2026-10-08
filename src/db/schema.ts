import { sql } from "drizzle-orm";
import {
  boolean,
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
  // name, emailVerified and updatedAt are required by Better Auth.
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: roleEnum("role").notNull().default("athlete"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Auth tables: the columns Better Auth expects, named in our snake_case style.
// Better Auth generates their ids, so there's no database default.

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

// One row per way of logging in. For email + password, providerId is
// "credential" and `password` holds the hash (never the password itself).
export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

// Short-lived tokens (email verification, password reset).
export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

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
