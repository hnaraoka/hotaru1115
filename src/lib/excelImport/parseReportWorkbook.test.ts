import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseReportWorkbook } from "@/lib/excelImport/parseReportWorkbook";

const SHEET_NAME = "職務経歴";

function buildWorkbook(cells: Record<string, string | number | Date>, sheetName = SHEET_NAME): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(sheetName);
  for (const [ref, value] of Object.entries(cells)) {
    ws.getCell(ref).value = value;
  }
  return workbook;
}

function fullReportCells(): Record<string, string | number | Date> {
  return {
    B2: "2026年6月分 月次報告書",
    Z4: new Date(Date.UTC(2026, 5, 1)), // 対象月: 2026年6月
    Z5: "5年", // 経験年数
    O5: "男性",
    S5: 34,
    G7: "テスト株式会社",
    G8: "東京",
    J9: 20,
    Q9: 160,
    X9: 15,
    AE9: 5,

    // 技術スタック: 2 rows per category (row, row+1), 4 columns (G,N,U,AB)
    G12: "TypeScript",
    N13: "JavaScript",
    G14: "React",
    G16: "PostgreSQL",
    G18: "Git",
    G20: "AWS",

    B27: new Date(Date.UTC(2024, 3, 1)), // プロジェクト参画年月: 2024年4月
    G27: "テストプロジェクト",
    G28: "設計・実装を担当しました",
    B31: "現在",
    B34: 27,

    AD31: "〇", // DEV_PROCESS_COLUMNS[4] = 製造

    G35: "成果物一式",
    G38: "特に問題なし",
    G41: "順調でした",

    G44: "良い",
    G46: "大変良い",
    G48: "普通",
    G50: "やや悪い",
    G52: "良い",
    G54: "悪い",

    AL49: "実装",
    AM49: 60,
    AL50: "打ち合わせ",
    AM50: 40,
    AL51: "計",
    AM51: 100,
  };
}

describe("parseReportWorkbook", () => {
  it("extracts every field from a well-formed workbook", () => {
    const result = parseReportWorkbook(buildWorkbook(fullReportCells()));

    expect(result.targetYear).toBe(2026);
    expect(result.targetMonth).toBe(6);
    expect(result.experienceYears).toBe("5");
    expect(result.gender).toBe("男性");
    expect(result.age).toBe("34");
    expect(result.clientCompany).toBe("テスト株式会社");
    expect(result.workLocation).toBe("東京");
    expect(result.workDays).toBe("20");
    expect(result.workHours).toBe("160");
    expect(result.teleworkDays).toBe("15");
    expect(result.onsiteDays).toBe("5");

    expect(result.techStack).toEqual({
      LANGUAGE: ["TypeScript", "JavaScript"],
      FRAMEWORK: ["React"],
      DATABASE: ["PostgreSQL"],
      TOOL: ["Git"],
      OS_ENV: ["AWS"],
    });

    expect(result.projectPeriodStartYear).toBe("2024");
    expect(result.projectPeriodStartMonth).toBe("4");
    expect(result.projectPeriodOngoing).toBe(true);
    expect(result.projectPeriodEndYear).toBeUndefined();
    expect(result.projectPeriodMonths).toBe("27");

    expect(result.projectName).toBe("テストプロジェクト");
    expect(result.workContent).toBe("設計・実装を担当しました");

    expect(result.devProcesses).toEqual(["製造"]);

    expect(result.deliverables).toBe("成果物一式");
    expect(result.troubles).toBe("特に問題なし");
    expect(result.goodPoints).toBe("順調でした");

    expect(result.condition).toBe("GOOD");
    expect(result.motivation).toBe("EXCELLENT");
    expect(result.workload).toBe("NORMAL");
    expect(result.difficulty).toBe("SLIGHTLY_BAD");
    expect(result.teamConsultability).toBe("GOOD");
    expect(result.growth).toBe("BAD");

    expect(result.workAllocations).toEqual([
      { category: "実装", percentage: 60 },
      { category: "打ち合わせ", percentage: 40 },
    ]);

    expect(result.warnings).toEqual([]);
  });

  it("stops reading work allocations at the '計' (total) row", () => {
    const result = parseReportWorkbook(buildWorkbook(fullReportCells()));
    expect(result.workAllocations).toHaveLength(2);
  });

  it("reports not-ongoing with an end date when B31 holds a date instead of '現在'", () => {
    const cells = fullReportCells();
    delete cells.B31;
    cells.B31 = new Date(Date.UTC(2026, 2, 1));
    const result = parseReportWorkbook(buildWorkbook(cells));
    expect(result.projectPeriodOngoing).toBe(false);
    expect(result.projectPeriodEndYear).toBe("2026");
    expect(result.projectPeriodEndMonth).toBe("3");
  });

  it("warns (but still parses) when B2 does not mention 月次報告書", () => {
    const cells = fullReportCells();
    cells.B2 = "何かの別のシート";
    const result = parseReportWorkbook(buildWorkbook(cells));
    expect(result.warnings).toContain(
      "テンプレートの形式が想定と異なる可能性があります。読み込んだ内容を確認してください。",
    );
    expect(result.clientCompany).toBe("テスト株式会社");
  });

  it("leaves targetYear/targetMonth undefined without warning when 対象月 (Z4) is missing", () => {
    const cells = fullReportCells();
    delete cells.Z4;
    const result = parseReportWorkbook(buildWorkbook(cells));
    expect(result.targetYear).toBeUndefined();
    expect(result.targetMonth).toBeUndefined();
    expect(result.warnings).not.toContain("対象月を読み取れませんでした");
  });

  it("warns when 参画先企業 (G7) is missing", () => {
    const cells = fullReportCells();
    delete cells.G7;
    const result = parseReportWorkbook(buildWorkbook(cells));
    expect(result.clientCompany).toBeUndefined();
    expect(result.warnings).toContain("「参画先企業」の項目が見つかりませんでした");
  });

  it("warns when both projectName and workContent are missing", () => {
    const cells = fullReportCells();
    delete cells.G27;
    delete cells.G28;
    const result = parseReportWorkbook(buildWorkbook(cells));
    expect(result.warnings).toContain("プロジェクト名・作業内容を読み取れませんでした");
  });

  it("warns when no work allocation rows are found", () => {
    const cells = fullReportCells();
    delete cells.AL49;
    delete cells.AL50;
    delete cells.AL51;
    const result = parseReportWorkbook(buildWorkbook(cells));
    expect(result.workAllocations).toBeUndefined();
    expect(result.warnings).toContain("作業配分の項目が見つかりませんでした");
  });

  it("dynamically shifts rows when an extra row is manually inserted into a 名称 category", () => {
    // ソフトウェア/ツールに手作業で1行追加された想定（2行→3行）。名称テーブル
    // より下のプロジェクト以降のセクションは、本来の行番号(27,28,31,34,35,
    // 38,41,44,46,48,50,52,54,49)からすべて1行分下にずれる。
    const cells: Record<string, string | number | Date> = {
      B2: "2026年6月分 月次報告書",
      Z4: new Date(Date.UTC(2026, 5, 1)),
      Z5: "5年",
      O5: "男性",
      S5: 34,
      G7: "テスト株式会社",
      G8: "東京",
      J9: 20,
      Q9: 160,
      X9: 15,
      AE9: 5,

      // 技術スタック(名称)の見出し。ソフトウェア/ツールのみ3行分。
      B12: "言語",
      B14: "FW",
      B16: "DB",
      B18: "ソフトウェア/ツール",
      B21: "OS/クラウド/開発環境",
      G12: "TypeScript",
      N13: "JavaScript",
      G14: "React",
      G16: "PostgreSQL",
      G18: "Git",
      G19: "Docker",
      G20: "WinSCP", // 追加された3行目
      G21: "AWS", // OS_ENVは1行分下(21行目)にずれる

      // 以降はすべて本来の行番号+1
      B28: new Date(Date.UTC(2024, 3, 1)), // プロジェクト参画年月
      G28: "テストプロジェクト",
      G29: "設計・実装を担当しました",
      B32: "現在",
      B35: 27,
      AD32: "〇", // DEV_PROCESS_COLUMNS[4] = 製造

      G36: "成果物一式",
      G39: "特に問題なし",
      G42: "順調でした",

      G45: "良い",
      G47: "大変良い",
      G49: "普通",
      G51: "やや悪い",
      G53: "良い",
      G55: "悪い",

      AL50: "実装",
      AM50: 60,
      AL51: "打ち合わせ",
      AM51: 40,
      AL52: "計",
      AM52: 100,
    };

    const result = parseReportWorkbook(buildWorkbook(cells));

    expect(result.techStack).toEqual({
      LANGUAGE: ["TypeScript", "JavaScript"],
      FRAMEWORK: ["React"],
      DATABASE: ["PostgreSQL"],
      TOOL: ["Git", "Docker", "WinSCP"],
      OS_ENV: ["AWS"],
    });

    expect(result.projectPeriodStartYear).toBe("2024");
    expect(result.projectPeriodStartMonth).toBe("4");
    expect(result.projectName).toBe("テストプロジェクト");
    expect(result.workContent).toBe("設計・実装を担当しました");
    expect(result.projectPeriodOngoing).toBe(true);
    expect(result.projectPeriodMonths).toBe("27");
    expect(result.devProcesses).toEqual(["製造"]);
    expect(result.deliverables).toBe("成果物一式");
    expect(result.troubles).toBe("特に問題なし");
    expect(result.goodPoints).toBe("順調でした");
    expect(result.condition).toBe("GOOD");
    expect(result.growth).toBe("BAD");
    expect(result.workAllocations).toEqual([
      { category: "実装", percentage: 60 },
      { category: "打ち合わせ", percentage: 40 },
    ]);
  });

  it("falls back to the first worksheet when '職務経歴' is not present", () => {
    const result = parseReportWorkbook(buildWorkbook(fullReportCells(), "Sheet1"));
    expect(result.clientCompany).toBe("テスト株式会社");
  });

  it("warns and returns immediately when the workbook has no worksheets at all", () => {
    const workbook = new ExcelJS.Workbook();
    const result = parseReportWorkbook(workbook);
    expect(result.warnings).toEqual(["シートが見つかりませんでした"]);
    expect(result.clientCompany).toBeUndefined();
  });
});
