import { afterEach, describe, expect, it, vi } from "vitest";
import { currentTargetMonthJst, previousTargetMonthJst } from "@/lib/reminder";

afterEach(() => {
  vi.useRealTimers();
});

describe("currentTargetMonthJst", () => {
  it("reads the current year/month in JST from a UTC clock", () => {
    // 2026-07-21T15:30:00Z is 2026-07-22 00:30 JST.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-21T15:30:00Z"));
    expect(currentTargetMonthJst()).toEqual({ year: 2026, month: 7 });
  });

  it("rolls over to the next JST day near UTC midnight without changing UTC date bugs", () => {
    // 2026-01-31T20:00:00Z is 2026-02-01 05:00 JST — still January in naive UTC read.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-31T20:00:00Z"));
    expect(currentTargetMonthJst()).toEqual({ year: 2026, month: 2 });
  });
});

describe("previousTargetMonthJst", () => {
  it("returns the prior month within the same year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T00:00:00Z"));
    expect(previousTargetMonthJst()).toEqual({ year: 2026, month: 6 });
  });

  it("rolls back across a year boundary in January", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T00:00:00Z"));
    expect(previousTargetMonthJst()).toEqual({ year: 2025, month: 12 });
  });

  it("uses the JST calendar day, not the UTC day, near midnight JST", () => {
    // 2026-02-28T15:30:00Z is 2026-03-01 00:30 JST, so "this month" is March
    // and the previous month must be February even though UTC still reads
    // February.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T15:30:00Z"));
    expect(previousTargetMonthJst()).toEqual({ year: 2026, month: 2 });
  });
});
