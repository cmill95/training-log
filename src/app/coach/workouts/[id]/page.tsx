import { and, asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { assignments, logs, users, workouts } from "@/db/schema";
import { requireRole } from "@/lib/require-role";
import { AssignForm } from "./assign-form";

export const metadata: Metadata = { title: "Workout · Training Log" };

export default async function WorkoutPage(
  props: PageProps<"/coach/workouts/[id]">,
) {
  const session = await requireRole("coach");
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) notFound();

  // Filtering by coach too: another coach's workout looks like a missing one.
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.coachId, session.user.id)));
  if (!workout) notFound();

  const [assigned, athletes] = await Promise.all([
    db
      .select({
        id: assignments.id,
        athleteName: users.name,
        dueDate: assignments.dueDate,
        loggedAt: logs.completedAt,
      })
      .from(assignments)
      .innerJoin(users, eq(users.id, assignments.athleteId))
      .leftJoin(logs, eq(logs.assignmentId, assignments.id))
      .where(eq(assignments.workoutId, id))
      .orderBy(desc(assignments.assignedAt)),
    // MVP: every athlete is listed (no teams yet).
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.role, "athlete"))
      .orderBy(asc(users.name)),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-12">
      <Link href="/coach" className="text-sm underline">
        ← Your workouts
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{workout.title}</h1>
        {workout.description && (
          <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400">
            {workout.description}
          </p>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Assigned to</h2>
        {assigned.length === 0 ? (
          <p className="text-zinc-500">Not assigned to anyone yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {assigned.map((assignment) => (
              <li
                key={assignment.id}
                className="flex justify-between gap-4 px-4 py-3"
              >
                <span>
                  {assignment.athleteName}
                  {assignment.loggedAt && " ✓"}
                </span>
                <span className="text-zinc-500">
                  {assignment.dueDate
                    ? `Due ${assignment.dueDate}`
                    : "No due date"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Assign</h2>
        {athletes.length === 0 ? (
          <p className="text-zinc-500">No athletes have signed up yet.</p>
        ) : (
          <AssignForm workoutId={workout.id} athletes={athletes} />
        )}
      </section>
    </main>
  );
}
