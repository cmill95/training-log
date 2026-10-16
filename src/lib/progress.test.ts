import { describe, expect, it } from "vitest";
import { summarize, weeklyCompletions } from "./progress";

// A Thursday; its week starts Monday 2026-10-12.
const now = new Date("2026-10-15T12:00:00Z");

describe("summarize", () => {
  it("is all zeros with no assignments", () => {
    expect(summarize([], now)).toEqual({ done: 0, toDo: 0, overdue: 0 });
  });

  it("counts logged, open and overdue assignments", () => {
    const rows = [
      { dueDate: "2026-10-01", loggedAt: new Date("2026-10-02") },
      { dueDate: "2026-10-14", loggedAt: null },
      { dueDate: "2026-10-20", loggedAt: null },
      { dueDate: null, loggedAt: null },
    ];
    expect(summarize(rows, now)).toEqual({ done: 1, toDo: 3, overdue: 1 });
  });

  it("doesn't count a late log as overdue", () => {
    const rows = [{ dueDate: "2026-10-01", loggedAt: new Date("2026-10-10") }];
    expect(summarize(rows, now).overdue).toBe(0);
  });
});

describe("weeklyCompletions", () => {
  it("returns 8 empty weeks, oldest first, ending this week", () => {
    const weeks = weeklyCompletions([], now);
    expect(weeks).toHaveLength(8);
    expect(weeks[0]).toEqual({ weekStart: "2026-08-24", count: 0 });
    expect(weeks[7]).toEqual({ weekStart: "2026-10-12", count: 0 });
  });

  it("counts each date in its week", () => {
    const weeks = weeklyCompletions(
      [
        new Date("2026-10-12T00:00:00Z"), // this Monday
        new Date("2026-10-15T09:00:00Z"),
        new Date("2026-10-11T23:59:59Z"), // last Sunday
      ],
      now,
    );
    expect(weeks.map((week) => week.count)).toEqual([0, 0, 0, 0, 0, 0, 1, 2]);
  });

  it("drops dates older than 8 weeks", () => {
    const weeks = weeklyCompletions(
      [new Date("2026-08-23T12:00:00Z"), new Date("2026-08-24T00:00:00Z")],
      now,
    );
    expect(weeks[0].count).toBe(1);
    expect(weeks.reduce((sum, week) => sum + week.count, 0)).toBe(1);
  });

  // Same limitation as isOverdue: weeks are UTC weeks.
  it("uses UTC, not the local date", () => {
    const sundayEveningInNewYork = new Date("2026-10-11T20:30:00-04:00");
    expect(weeklyCompletions([sundayEveningInNewYork], now)[7].count).toBe(1);
  });
});
