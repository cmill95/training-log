import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments, logs, workouts } from "@/db/schema";

// Assignments of this coach's workouts (optionally for one athlete), each with
// its log if there is one. Other coaches' assignments are never included.
// In its own module, not the page, so an integration test can call it.
export function coachAssignments(coachId: string, athleteId?: string) {
  return (
    db
      .select({
        id: assignments.id,
        athleteId: assignments.athleteId,
        title: workouts.title,
        dueDate: assignments.dueDate,
        loggedAt: logs.completedAt,
        sets: logs.sets,
        reps: logs.reps,
        durationSeconds: logs.durationSeconds,
        notes: logs.notes,
      })
      .from(assignments)
      .innerJoin(workouts, eq(workouts.id, assignments.workoutId))
      .leftJoin(logs, eq(logs.assignmentId, assignments.id))
      .where(
        and(
          eq(workouts.coachId, coachId),
          // and() skips undefined, so no athleteId means every athlete.
          athleteId ? eq(assignments.athleteId, athleteId) : undefined,
        ),
      )
      // Most recent logs first; unlogged ones (null) sort first in Postgres desc.
      .orderBy(desc(logs.completedAt), desc(assignments.assignedAt))
  );
}
