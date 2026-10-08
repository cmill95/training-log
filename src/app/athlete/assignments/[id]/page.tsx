import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { assignments, logs, users, workouts } from "@/db/schema";
import { requireRole } from "@/lib/require-role";
import { LogForm } from "./log-form";

export const metadata: Metadata = { title: "Workout · Training Log" };

export default async function AssignmentPage(
  props: PageProps<"/athlete/assignments/[id]">,
) {
  const session = await requireRole("athlete");
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) notFound();

  // Filtering by athlete too: someone else's assignment looks like a missing one.
  const [assignment] = await db
    .select({
      title: workouts.title,
      description: workouts.description,
      coachName: users.name,
      dueDate: assignments.dueDate,
      log: logs,
    })
    .from(assignments)
    .innerJoin(workouts, eq(workouts.id, assignments.workoutId))
    .innerJoin(users, eq(users.id, workouts.coachId))
    .leftJoin(logs, eq(logs.assignmentId, assignments.id))
    .where(
      and(eq(assignments.id, id), eq(assignments.athleteId, session.user.id)),
    );
  if (!assignment) notFound();
  const { log } = assignment;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-12">
      <Link href="/athlete" className="text-sm underline">
        ← My workouts
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{assignment.title}</h1>
        <p className="text-sm text-zinc-500">
          From {assignment.coachName}
          {assignment.dueDate && ` · Due ${assignment.dueDate}`}
        </p>
        {assignment.description && (
          <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400">
            {assignment.description}
          </p>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{log ? "✓ Logged" : "Log it"}</h2>
        {log ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-zinc-500">Completed</dt>
            <dd>{log.completedAt.toISOString().slice(0, 10)}</dd>
            {log.sets !== null && (
              <>
                <dt className="text-zinc-500">Sets</dt>
                <dd>{log.sets}</dd>
              </>
            )}
            {log.reps !== null && (
              <>
                <dt className="text-zinc-500">Reps</dt>
                <dd>{log.reps}</dd>
              </>
            )}
            {log.durationSeconds !== null && (
              <>
                <dt className="text-zinc-500">Time</dt>
                <dd>{formatDuration(log.durationSeconds)}</dd>
              </>
            )}
            {log.notes && (
              <>
                <dt className="text-zinc-500">Notes</dt>
                <dd className="whitespace-pre-line">{log.notes}</dd>
              </>
            )}
          </dl>
        ) : (
          <LogForm assignmentId={id} />
        )}
      </section>
    </main>
  );
}

// 750 → "12:30"
function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
