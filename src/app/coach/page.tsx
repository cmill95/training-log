import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { requireRole } from "@/lib/require-role";
import { NewWorkoutForm } from "./new-workout-form";

export const metadata: Metadata = { title: "Workouts · Training Log" };

export default async function CoachPage() {
  const session = await requireRole("coach");
  const myWorkouts = await db
    .select({ id: workouts.id, title: workouts.title })
    .from(workouts)
    .where(eq(workouts.coachId, session.user.id))
    .orderBy(desc(workouts.createdAt));

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-12">
      <Link href="/" className="text-sm underline">
        ← Home
      </Link>
      <h1 className="text-2xl font-semibold">Your workouts</h1>

      {myWorkouts.length === 0 ? (
        <p className="text-zinc-500">
          No workouts yet. Create your first one below.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {myWorkouts.map((workout) => (
            <li key={workout.id}>
              <Link
                href={`/coach/workouts/${workout.id}`}
                className="block px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                {workout.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">New workout</h2>
        <NewWorkoutForm />
      </section>
    </main>
  );
}
