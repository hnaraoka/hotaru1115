import { describe, expect, it } from "vitest";
import { buildReportInputSchema } from "@/lib/reportSchema";

const reportInputSchema = buildReportInputSchema(true);

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    submittedAt: "2026-07-01",
    targetYear: 2026,
    targetMonth: 6,
    gender: "男性",
    age: 30,
    experienceYears: 5,
    clientCompany: "テスト株式会社",
    workLocation: "東京",
    workDays: 20,
    workHours: 160,
    teleworkDays: 15,
    onsiteDays: 5,
    projectName: "テストプロジェクト",
    projectPeriodStartYear: 2025,
    projectPeriodStartMonth: 1,
    projectPeriodOngoing: true,
    projectPeriodEndYear: null,
    projectPeriodEndMonth: null,
    projectPeriodMonths: 6,
    workContent: "・設計\n・実装",
    devProcesses: ["製造"],
    deliverables: "成果物A",
    troubles: "特になし",
    goodPoints: "順調でした",
    condition: "GOOD",
    motivation: "GOOD",
    workload: "NORMAL",
    difficulty: "NORMAL",
    teamConsultability: "GOOD",
    growth: "GOOD",
    techStackItems: [{ category: "LANGUAGE", name: "TypeScript" }],
    workAllocations: [
      { category: "実装", percentage: 80 },
      { category: "打ち合わせ", percentage: 20 },
    ],
    ...overrides,
  };
}

describe("reportInputSchema", () => {
  it("accepts a fully valid report", () => {
    const result = reportInputSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });

  it("rejects when workAllocations do not sum to 100", () => {
    const result = reportInputSchema.safeParse(
      baseInput({
        workAllocations: [{ category: "実装", percentage: 50 }],
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "workAllocations");
      expect(issue?.message).toContain("100%");
      expect(issue?.message).toContain("50%");
    }
  });

  it("rejects when workDays does not equal telework + onsite days", () => {
    const result = reportInputSchema.safeParse(
      baseInput({ workDays: 20, teleworkDays: 10, onsiteDays: 5 }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "workDays");
      expect(issue?.message).toContain("15日");
    }
  });

  it("requires end year/month when the project is not ongoing", () => {
    const result = reportInputSchema.safeParse(
      baseInput({ projectPeriodOngoing: false, projectPeriodEndYear: null, projectPeriodEndMonth: null }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "projectPeriodEndYear");
      expect(issue).toBeDefined();
    }
  });

  it("accepts a non-ongoing project with a valid end date", () => {
    const result = reportInputSchema.safeParse(
      baseInput({ projectPeriodOngoing: false, projectPeriodEndYear: 2026, projectPeriodEndMonth: 3 }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an empty devProcesses selection", () => {
    const result = reportInputSchema.safeParse(baseInput({ devProcesses: [] }));
    expect(result.success).toBe(false);
  });

  it("rejects an empty workAllocations array", () => {
    const result = reportInputSchema.safeParse(baseInput({ workAllocations: [] }));
    expect(result.success).toBe(false);
  });

  it("rejects clientCompany longer than 200 characters", () => {
    const result = reportInputSchema.safeParse(baseInput({ clientCompany: "あ".repeat(201) }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid rating enum value", () => {
    const result = reportInputSchema.safeParse(baseInput({ condition: "VERY_GOOD" }));
    expect(result.success).toBe(false);
  });
});

describe("buildReportInputSchema(false) — devProcesses not required (内勤)", () => {
  it("accepts an empty devProcesses selection", () => {
    const result = buildReportInputSchema(false).safeParse(baseInput({ devProcesses: [] }));
    expect(result.success).toBe(true);
  });

  it("still accepts a non-empty devProcesses selection", () => {
    const result = buildReportInputSchema(false).safeParse(baseInput({ devProcesses: ["製造"] }));
    expect(result.success).toBe(true);
  });
});
