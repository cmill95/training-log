import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { assignments, logs, users, workouts } from "@/db/schema";
import { requireRole } from "@/lib/require-role";

export const metadata: Metadata = { title: "My workouts · Training Log" };

type Row = {
  id: number;
  title: string;
  coachName: string;
  dueDate: string | null;
  loggedAt: Date | null;
};

export default async function AthletePage() {
  const session = await requireRole("athlete");
  const rows = await db
    .select({
      id: assignments.id,
      title: workouts.title,
      coachName: users.name,
      dueDate: assignments.dueDate,
      loggedAt: logs.completedAt,
    })
    .from(assignments)
    .innerJoin(workouts, eq(workouts.id, assignments.workoutId))
    .innerJoin(users, eq(users.id, workouts.coachId))
    // Left join: assignments with no log yet still come back, with loggedAt null.
    .leftJoin(logs, eq(logs.assignmentId, assignments.id))
    .where(eq(assignments.athleteId, session.user.id))
    .orderBy(asc(assignments.dueDate), desc(assignments.assignedAt));

  const toDo = rows.filter((row) => !row.loggedAt);
  const done = rows
    .filter((row) => row.loggedAt)
    .sort((a, b) => b.loggedAt!.getTime() - a.loggedAt!.getTime());
  // Compared as "YYYY-MM-DD" strings in UTC (the server's clock); an athlete
  // far from UTC may see "overdue" a few hours early or late.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-12">
      <Link href="/" className="text-sm underline">
        ← Home
      </Link>
      <h1 className="text-2xl font-semibold">My workouts</h1>

      {rows.length === 0 ? (
        <p className="text-zinc-500">
          Nothing assigned yet. Your coach&apos;s workouts will show up here.
        </p>
      ) : (
        <>
          <Section title="To do" empty="All caught up.">
            {toDo.map((row) => (
              <Item key={row.id} row={row}>
                {row.dueDate && row.dueDate < today ? (
                  <span className="text-red-600 dark:text-red-400">
                    Overdue · {row.dueDate}
                  </span>
                ) : (
                  (row.dueDate && `Due ${row.dueDate}`) || "No due date"
                )}
              </Item>
            ))}
          </Section>
          <Section title="Done" empty="Nothing logged yet.">
            {done.map((row) => (
              <Item key={row.id} row={row}>
                ✓ {row.loggedAt!.toISOString().slice(0, 10)}
              </Item>
            ))}
          </Section>
        </>
      )}
    </main>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children.length === 0 ? (
        <p className="text-zinc-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {children}
        </ul>
      )}
    </section>
  );
}

function Item({ row, children }: { row: Row; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={`/athlete/assignments/${row.id}`}
        className="flex justify-between gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        <span>
          {row.title}
          <span className="block text-sm text-zinc-500">{row.coachName}</span>
        </span>
        <span className="text-right text-sm text-zinc-500">{children}</span>
      </Link>
    </li>
  );
}
