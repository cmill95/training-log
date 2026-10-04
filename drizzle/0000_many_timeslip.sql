CREATE TYPE "public"."role" AS ENUM('coach', 'athlete');--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "assignments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workout_id" integer NOT NULL,
	"athlete_id" text NOT NULL,
	"due_date" date,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"assignment_id" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sets" integer,
	"reps" integer,
	"duration_seconds" integer,
	"notes" text,
	CONSTRAINT "logs_assignment_id_unique" UNIQUE("assignment_id"),
	CONSTRAINT "logs_sets_nonnegative" CHECK ("logs"."sets" >= 0),
	CONSTRAINT "logs_reps_nonnegative" CHECK ("logs"."reps" >= 0),
	CONSTRAINT "logs_duration_nonnegative" CHECK ("logs"."duration_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"image" text,
	"role" "role" DEFAULT 'athlete' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "workouts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"coach_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_athlete_id_users_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignments_workout_id_idx" ON "assignments" USING btree ("workout_id");--> statement-breakpoint
CREATE INDEX "assignments_athlete_id_idx" ON "assignments" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "workouts_coach_id_idx" ON "workouts" USING btree ("coach_id");