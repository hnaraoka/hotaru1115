import { describe, expect, it } from "vitest";
import { calculateAgeAsOf, calculateExperienceYears } from "@/lib/ageCalc";

describe("calculateAgeAsOf", () => {
  it("computes age when the target month is after the birth month", () => {
    // Born April 1990, as of July of the target year -> already had a birthday this year.
    expect(calculateAgeAsOf(new Date("1990-04-15T00:00:00Z"), 2026, 7)).toBe(36);
  });

  it("subtracts one year when the target month is before the birth month", () => {
    // Born November 1990, as of March of the target year -> birthday hasn't happened yet.
    expect(calculateAgeAsOf(new Date("1990-11-15T00:00:00Z"), 2026, 3)).toBe(35);
  });

  it("treats the birth month itself as already having had the birthday", () => {
    expect(calculateAgeAsOf(new Date("1990-07-01T00:00:00Z"), 2026, 7)).toBe(36);
  });

  it("never returns a negative age", () => {
    expect(calculateAgeAsOf(new Date("2027-01-01T00:00:00Z"), 2026, 7)).toBe(0);
  });
});

describe("calculateExperienceYears", () => {
  it("computes whole elapsed years", () => {
    expect(calculateExperienceYears(2020, 4, 2026, 7)).toBe(6);
  });

  it("floors partial years instead of rounding", () => {
    // 2020-04 -> 2026-03 is 5 years and 11 months, not yet 6.
    expect(calculateExperienceYears(2020, 4, 2026, 3)).toBe(5);
  });

  it("returns exactly 0 for the same start month", () => {
    expect(calculateExperienceYears(2026, 7, 2026, 7)).toBe(0);
  });

  it("never returns a negative value for a target before the start date", () => {
    expect(calculateExperienceYears(2027, 1, 2026, 7)).toBe(0);
  });
});
