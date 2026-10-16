import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { summarize } from "@/lib/progress";
import { requireRole } from "@/lib/require-role";
import { coachAssignments } from "./queries";

export const metadata: Metadata = { title: "Athletes · Training Log" };

export default async function AthletesPage() {
  const session = await requireRole("coach");
  const [athletes, rows] = await Promise.all([
    // MVP: every athlete is listed (no teams yet).
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.role, "athlete"))
      .orderBy(asc(users.name)),
    coachAssignments(session.user.id),
  ]);
  const now = new Date();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-12">
      <Link href="/coach" className="text-sm underline">
        ← Your workouts
      </Link>
      <h1 className="text-2xl font-semibold">Athletes</h1>

      {athletes.length === 0 ? (
        <p className="text-zinc-500">No athletes have signed up yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {athletes.map((athlete) => {
            const theirs = rows.filter((row) => row.athleteId === athlete.id);
            const { done, toDo, overdue } = summarize(theirs, now);
            // Rows come newest log first, so the first logged one is the latest.
            const lastLogged = theirs.find((row) => row.loggedAt)?.loggedAt;
            return (
              <li key={athlete.id}>
                <Link
                  href={`/coach/athletes/${athlete.id}`}
                  className="flex justify-between gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <span>
                    {athlete.name}
                    <span className="block text-sm text-zinc-500">
                      {theirs.length === 0
                        ? "Nothing assigned"
                        : `${done} done · ${toDo} to do`}
                      {overdue > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          {` · ${overdue} overdue`}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="text-right text-sm text-zinc-500">
                    {lastLogged
                      ? `Last ${lastLogged.toISOString().slice(0, 10)}`
                      : "No logs yet"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
