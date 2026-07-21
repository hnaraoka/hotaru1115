import { describe, expect, it } from "vitest";
import {
  ratingLabel,
  techCategoryLabel,
  reviewStatusLabel,
  reviewStatusColor,
  formatProjectPeriod,
} from "@/lib/format";
import type { Report } from "@prisma/client";

function periodReport(overrides: Partial<Report>): Report {
  return {
    projectPeriodStartYear: null,
    projectPeriodStartMonth: null,
    projectPeriodOngoing: true,
    projectPeriodEndYear: null,
    projectPeriodEndMonth: null,
    projectPeriodMonths: null,
    ...overrides,
  } as Report;
}

describe("ratingLabel", () => {
  it("maps known rating values to their Japanese label", () => {
    expect(ratingLabel("EXCELLENT")).toBe("大変良い");
    expect(ratingLabel("BAD")).toBe("悪い");
  });

  it("falls back to a dash for null or unknown values", () => {
    expect(ratingLabel(null)).toBe("-");
    expect(ratingLabel("UNKNOWN")).toBe("-");
  });
});

describe("techCategoryLabel", () => {
  it("maps known categories and falls back to the raw value otherwise", () => {
    expect(techCategoryLabel("LANGUAGE")).toBe("言語");
    expect(techCategoryLabel("SOMETHING_ELSE")).toBe("SOMETHING_ELSE");
  });
});

describe("reviewStatusLabel / reviewStatusColor", () => {
  it("labels APPROVED, NEEDS_REVISION, and default (PENDING) distinctly", () => {
    expect(reviewStatusLabel("APPROVED")).toBe("承認済み");
    expect(reviewStatusLabel("NEEDS_REVISION")).toBe("差し戻し");
    expect(reviewStatusLabel("PENDING")).toBe("未レビュー");
  });

  it("returns a distinct color per status", () => {
    const colors = new Set([
      reviewStatusColor("APPROVED"),
      reviewStatusColor("NEEDS_REVISION"),
      reviewStatusColor("PENDING"),
    ]);
    expect(colors.size).toBe(3);
  });
});

describe("formatProjectPeriod", () => {
  it("formats an ongoing project with a known start date", () => {
    const report = periodReport({ projectPeriodStartYear: 2024, projectPeriodStartMonth: 4, projectPeriodOngoing: true });
    expect(formatProjectPeriod(report)).toBe("2024年4月 〜 現在 ");
  });

  it("formats a finished project with start, end, and duration", () => {
    const report = periodReport({
      projectPeriodStartYear: 2024,
      projectPeriodStartMonth: 4,
      projectPeriodOngoing: false,
      projectPeriodEndYear: 2024,
      projectPeriodEndMonth: 9,
      projectPeriodMonths: 6,
    });
    expect(formatProjectPeriod(report)).toBe("2024年4月 〜 2024年9月 （6ヶ月）");
  });

  it("shows 不明 when start or end data is missing", () => {
    const report = periodReport({ projectPeriodOngoing: false });
    expect(formatProjectPeriod(report)).toBe("不明 〜 不明 ");
  });
});
