import { describe, expect, it } from "vitest";
import { isOverdue } from "./due-date";

describe("isOverdue", () => {
  const now = new Date("2026-10-15T12:00:00Z");

  it("is false with no due date", () => {
    expect(isOverdue(null, now)).toBe(false);
  });

  it("is true once the due date has passed", () => {
    expect(isOverdue("2026-10-14", now)).toBe(true);
  });

  it("is false on the due date itself", () => {
    expect(isOverdue("2026-10-15", now)).toBe(false);
  });

  it("is false before the due date", () => {
    expect(isOverdue("2026-10-16", now)).toBe(false);
  });

  // Known limitation: "today" is the UTC date. At 8:30pm on Oct 15 in
  // New York it's already Oct 16 in UTC, so an Oct 15 workout shows overdue.
  it("uses the UTC date, not the local one", () => {
    const eveningInNewYork = new Date("2026-10-15T20:30:00-04:00");
    expect(isOverdue("2026-10-15", eveningInNewYork)).toBe(true);
  });
});
