import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WeeklyBarChart } from "@/components/weekly-bar-chart";
import { db } from "@/db";
import { users } from "@/db/schema";
import { formatDuration } from "@/lib/duration";
import { summarize, weeklyCompletions } from "@/lib/progress";
import { requireRole } from "@/lib/require-role";
import { coachAssignments } from "../queries";

export const metadata: Metadata = { title: "Athlete progress · Training Log" };

export default async function AthletePage(
  props: PageProps<"/coach/athletes/[id]">,
) {
  const session = await requireRole("coach");
  const { id } = await props.params;

  const [athlete] = await db
    .select({ name: users.name })
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "athlete")));
  if (!athlete) notFound();

  const rows = await coachAssignments(session.user.id, id);
  const now = new Date();
  const { done, toDo, overdue } = summarize(rows, now);
  const logged = rows.filter((row) => row.loggedAt);
  const weeks = weeklyCompletions(
    logged.map((row) => row.loggedAt!),
    now,
  );

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-12">
      <Link href="/coach/athletes" className="text-sm underline">
        ← Athletes
      </Link>
      <h1 className="text-2xl font-semibold">{athlete.name}</h1>

      {rows.length === 0 ? (
        <p className="text-zinc-500">
          You haven&apos;t assigned {athlete.name} any workouts yet.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Done" value={done} />
            <Stat label="To do" value={toDo} />
            <Stat label="Overdue" value={overdue} alert={overdue > 0} />
          </dl>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Completed per week</h2>
            <WeeklyBarChart weeks={weeks} />
            {logged.length === 0 && (
              <p className="text-zinc-500">Nothing logged yet.</p>
            )}
          </section>

          {logged.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Recent logs</h2>
              <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {logged.map((row) => (
                  <li key={row.id} className="flex flex-col gap-1 px-4 py-3">
                    <span className="flex justify-between gap-4">
                      {row.title}
                      <span className="text-sm text-zinc-500">
                        {row.loggedAt!.toISOString().slice(0, 10)}
                      </span>
                    </span>
                    <span className="text-sm text-zinc-500">
                      {[
                        row.sets !== null && `${row.sets} sets`,
                        row.reps !== null && `${row.reps} reps`,
                        row.durationSeconds !== null &&
                          formatDuration(row.durationSeconds),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {row.notes && (
                      <p className="whitespace-pre-line text-sm">{row.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse rounded-md border border-zinc-200 px-2 py-3 dark:border-zinc-800">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd
        className={`text-2xl font-semibold ${alert ? "text-red-600 dark:text-red-400" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
