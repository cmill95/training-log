// dueDate is a Postgres `date`, which Drizzle returns as "YYYY-MM-DD".
// Compared as strings against today's date in UTC (the server's clock); an
// athlete far from UTC may see "overdue" a few hours early or late.
export function isOverdue(dueDate: string | null, now: Date): boolean {
  if (!dueDate) return false;
  const today = now.toISOString().slice(0, 10);
  return dueDate < today;
}
