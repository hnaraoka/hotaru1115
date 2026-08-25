import { describe, expect, it } from "vitest";
import { REPORT_CSV_HEADER, reportToCsvRow, type ExportableReport } from "@/lib/reportCsv";

function baseReport(overrides: Partial<ExportableReport>): ExportableReport {
  return {
    id: "report-1",
    userId: "user-1",
    user: { name: "山田太郎", loginId: "yamada" },
    submittedAt: new Date("2026-08-05T00:00:00Z"),
    targetYear: 2026,
    targetMonth: 7,
    gender: "男性",
    age: 30,
    experienceYears: 5,
    clientCompany: "株式会社サンプル",
    workLocation: "在宅",
    workDays: 20,
    workHours: 160,
    teleworkDays: 15,
    onsiteDays: 5,
    projectName: "基幹システム刷新",
    projectPeriodStartYear: 2026,
    projectPeriodStartMonth: 4,
    projectPeriodOngoing: true,
    projectPeriodEndYear: null,
    projectPeriodEndMonth: null,
    projectPeriodMonths: null,
    workContent: "API開発",
    devProcesses: ["詳細設計", "製造"],
    deliverables: "設計書一式",
    troubles: "特になし",
    goodPoints: "チーム連携が良かった",
    condition: "GOOD",
    motivation: "EXCELLENT",
    workload: "NORMAL",
    difficulty: "NORMAL",
    teamConsultability: "GOOD",
    growth: "GOOD",
    pdfBlobUrl: null,
    reviewStatus: "APPROVED",
    reviewComment: null,
    reviewedAt: new Date("2026-08-10T01:23:00Z"),
    reviewedByName: "管理者A",
    createdAt: new Date("2026-08-01T09:00:00Z"),
    updatedAt: new Date("2026-08-10T01:23:00Z"),
    techStackItems: [{ id: "t1", reportId: "report-1", category: "LANGUAGE", name: "TypeScript", sortOrder: 0 }],
    workAllocations: [{ id: "w1", reportId: "report-1", category: "実装", percentage: 80, sortOrder: 0 }],
    ...overrides,
  } as ExportableReport;
}

describe("reportToCsvRow", () => {
  it("has one cell per header column", () => {
    const row = reportToCsvRow(baseReport({}));
    expect(row.length).toBe(REPORT_CSV_HEADER.length);
  });

  it("flattens user, ratings, tech stack, and work allocations into readable cells", () => {
    const row = reportToCsvRow(baseReport({}));
    expect(row).toContain("山田太郎");
    expect(row).toContain("yamada");
    expect(row).toContain("良い"); // condition: GOOD
    expect(row).toContain("言語:TypeScript");
    expect(row).toContain("実装 80%");
    expect(row).toContain("承認済み");
  });

  it("renders null optional fields as empty strings rather than 'null'", () => {
    const row = reportToCsvRow(
      baseReport({
        gender: null,
        age: null,
        deliverables: null,
        troubles: null,
        reviewedAt: null,
        reviewedByName: null,
      }),
    );
    expect(row).not.toContain("null");
  });
});
