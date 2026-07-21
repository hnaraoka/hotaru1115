import { describe, expect, it } from "vitest";
import { toReportCreateData, toReportUpdateData } from "@/lib/reportData";
import type { ReportInput } from "@/lib/reportSchema";

function baseInput(overrides: Partial<ReportInput> = {}): ReportInput {
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
    workContent: "設計・実装",
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
    techStackItems: [
      { category: "LANGUAGE", name: "TypeScript" },
      { category: "TOOL", name: "Git" },
    ],
    workAllocations: [
      { category: "実装", percentage: 80 },
      { category: "打ち合わせ", percentage: 20 },
    ],
    ...overrides,
  } as ReportInput;
}

describe("toReportCreateData", () => {
  it("assigns sortOrder by array index for tech stack items and work allocations", () => {
    const data = toReportCreateData(baseInput(), "user-1");
    expect(data.techStackItems?.create).toEqual([
      { category: "LANGUAGE", name: "TypeScript", sortOrder: 0 },
      { category: "TOOL", name: "Git", sortOrder: 1 },
    ]);
    expect(data.workAllocations?.create).toEqual([
      { category: "実装", percentage: 80, sortOrder: 0 },
      { category: "打ち合わせ", percentage: 20, sortOrder: 1 },
    ]);
  });

  it("connects the report to the given user", () => {
    const data = toReportCreateData(baseInput(), "user-42");
    expect(data.user).toEqual({ connect: { id: "user-42" } });
  });

  it("clears end year/month when the project is ongoing, even if provided", () => {
    const data = toReportCreateData(
      baseInput({ projectPeriodOngoing: true, projectPeriodEndYear: 2030, projectPeriodEndMonth: 5 }),
      "user-1",
    );
    expect(data.projectPeriodEndYear).toBeNull();
    expect(data.projectPeriodEndMonth).toBeNull();
  });

  it("keeps end year/month when the project is not ongoing", () => {
    const data = toReportCreateData(
      baseInput({ projectPeriodOngoing: false, projectPeriodEndYear: 2026, projectPeriodEndMonth: 3 }),
      "user-1",
    );
    expect(data.projectPeriodEndYear).toBe(2026);
    expect(data.projectPeriodEndMonth).toBe(3);
  });

  it("normalizes nullable optional fields to null instead of undefined", () => {
    const data = toReportCreateData(
      baseInput({ gender: null, deliverables: null, troubles: null, goodPoints: null }),
      "user-1",
    );
    expect(data.gender).toBeNull();
    expect(data.deliverables).toBeNull();
    expect(data.troubles).toBeNull();
    expect(data.goodPoints).toBeNull();
  });
});

describe("toReportUpdateData", () => {
  it("replaces tech stack items and work allocations wholesale (deleteMany + create)", () => {
    const data = toReportUpdateData(baseInput());
    expect(data.techStackItems).toMatchObject({ deleteMany: {} });
    expect(data.workAllocations).toMatchObject({ deleteMany: {} });
    expect(data.techStackItems).toHaveProperty("create");
    expect(data.workAllocations).toHaveProperty("create");
  });

  it("does not include a user relation (unlike create)", () => {
    const data = toReportUpdateData(baseInput());
    expect(data).not.toHaveProperty("user");
  });
});
