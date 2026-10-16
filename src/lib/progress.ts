import { isOverdue } from "./due-date";

const WEEKS = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type WeekCount = { weekStart: string; count: number };

// Overdue assignments are also counted in toDo.
export function summarize(
  rows: { dueDate: string | null; loggedAt: Date | null }[],
  now: Date,
) {
  let done = 0;
  let toDo = 0;
  let overdue = 0;
  for (const row of rows) {
    if (row.loggedAt) {
      done++;
    } else {
      toDo++;
      if (isOverdue(row.dueDate, now)) overdue++;
    }
  }
  return { done, toDo, overdue };
}

// Completions in each of the last 8 weeks, oldest first, including the
// current week and weeks with none. Weeks start Monday in UTC, like isOverdue.
export function weeklyCompletions(dates: Date[], now: Date): WeekCount[] {
  const thisWeek = mondayUtc(now);
  const weeks = Array.from({ length: WEEKS }, (_, i) => ({
    weekStart: new Date(thisWeek - (WEEKS - 1 - i) * WEEK_MS)
      .toISOString()
      .slice(0, 10),
    count: 0,
  }));
  for (const date of dates) {
    // UTC has no daylight saving, so every week is exactly WEEK_MS long.
    const index = WEEKS - 1 - (thisWeek - mondayUtc(date)) / WEEK_MS;
    if (index >= 0 && index < WEEKS) weeks[index].count++;
  }
  return weeks;
}

// Midnight UTC on the Monday of `date`'s week, in milliseconds.
function mondayUtc(date: Date) {
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - daysSinceMonday,
  );
}
