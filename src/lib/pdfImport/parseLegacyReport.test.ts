import { describe, expect, it } from "vitest";
import { parseLegacyReport } from "@/lib/pdfImport/parseLegacyReport";
import type { PdfTextItem } from "@/lib/pdfImport/extractTextItems";

// PDF coordinate space: y grows upward from the bottom of the page, so a
// row that appears visually higher on the page has a *larger* y than a row
// below it. Fixtures below are laid out with descending y, top to bottom,
// mirroring the legacy report template's actual layout.
function item(text: string, x: number, y: number, width = 100, height = 12): PdfTextItem {
  return { text, x, y, width, height };
}

/**
 * A synthetic "full document" fixture whose coordinates are handcrafted to
 * satisfy every extraction rule in parseLegacyReport.ts at once, so a single
 * parse exercises (and regression-protects) every field the parser knows
 * about.
 */
function fullDocumentItems(): PdfTextItem[] {
  return [
    // 対象月 / 経験年数
    item("対象月", 50, 900, 48),
    item("2026年6月", 110, 900),
    item("経験年数", 50, 880, 64),
    item("5年", 126, 880),

    // 性別 / 年齢 (value below the label)
    item("性別", 50, 860, 32),
    item("男性", 55, 855),
    item("年齢", 50, 830, 32),
    item("34", 52, 825),

    // 参画先企業 / 作業場所
    item("参画先企業", 50, 800, 88),
    item("テスト株式会社", 145, 800),
    item("作業場所", 50, 780, 64),
    item("東京", 121, 780),

    // 月間実労働: 日数 / 時間 / テレワーク / 現場
    item("日数", 50, 760, 32),
    item("20日", 90, 760),
    item("時間", 50, 740, 32),
    item("160時間", 90, 740),
    item("テレワーク", 50, 720, 80),
    item("15日", 138, 720),
    item("現場", 50, 700, 32),
    item("5日", 90, 700),

    // 技術スタック: 5 category bands
    item("名称", 250, 680),
    item("言語", 50, 660, 32),
    item("TypeScript/JavaScript", 100, 660),
    item("FW", 50, 640, 24),
    item("React", 90, 640),
    item("DB", 50, 620, 24),
    item("PostgreSQL", 90, 620),
    item("ソフトウェア/ツール", 50, 600, 136),
    item("Git/VSCode", 200, 600),
    item("OS/クラウド/開発環境", 50, 580, 152),
    item("AWS/Linux", 215, 580),

    // プロジェクト期間
    item("期間", 50, 460),
    item("2024年4月", 60, 450),
    item("現在", 60, 435),
    item("6ヶ月", 60, 420),

    // プロジェクト名・作業内容・成果物 (one band, split by the largest y-gap)
    item("プロジェクト名/作業内容", 50, 400),
    item("テストプロジェクト", 150, 390),
    item("・設計を担当", 150, 375),
    item("・実装を担当", 150, 360),
    item("成果物", 50, 300),
    item("成果物A", 150, 325),
    item("成果物B", 150, 313),

    // 今月の困った点と対応・解決方法 (two-line label pair + interleaved paragraph)
    item("今月の困った点", 50, 280),
    item("対応・解決方法", 50, 270),
    item("特に大きな問題は", 150, 286, 100),
    item("ありませんでした", 150, 265, 100),

    // 今月の良かった点/改善提案など
    item("今月の良かった点", 50, 230),
    item("改善提案など", 50, 220),
    item("チームの連携が", 150, 236, 100),
    item("スムーズでした", 150, 215, 100),

    // 開発工程: stacked single-character column headers + checkmarks
    item("開発工程", 50, 150),
    item("製", 420, 149, 10),
    item("造", 420, 144, 10),
    item("詳", 500, 149, 10),
    item("細", 500, 144, 10),
    item("設", 500, 139, 10),
    item("計", 500, 134, 10),
    item("〇", 422, 80, 10),

    // 自己評価
    item("体調", 50, 50, 32),
    item("良い", 90, 50),
    item("モチベーション", 50, 30, 80),
    item("大変良い", 140, 30),
    item("業務量", 50, 10, 48),
    item("普通", 110, 10),
    item("業務難易度", 50, -10, 80),
    item("やや悪い", 140, -10),
    item("チーム内の相談しやすさ", 50, -30, 176),
    item("良い", 240, -30),
    item("成長実感", 50, -50, 64),
    item("悪い", 130, -50),

    // 作業配分 (legend only; percentages are not extractable from the PDF)
    item("作業配分", 50, -300),
    item("実装", 200, -320),
    item("打ち合わせ", 200, -340),
  ];
}

describe("parseLegacyReport", () => {
  it("extracts every field from a well-formed legacy report PDF", () => {
    const result = parseLegacyReport(fullDocumentItems());

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
      TOOL: ["Git", "VSCode"],
      OS_ENV: ["AWS", "Linux"],
    });

    expect(result.projectPeriodStartYear).toBe("2024");
    expect(result.projectPeriodStartMonth).toBe("4");
    expect(result.projectPeriodOngoing).toBe(true);
    expect(result.projectPeriodEndYear).toBeUndefined();
    expect(result.projectPeriodMonths).toBe("6");

    expect(result.projectName).toBe("テストプロジェクト");
    expect(result.workContent).toBe("設計を担当\n実装を担当");
    expect(result.deliverables).toBe("成果物A\n成果物B");

    expect(result.troubles).toBe("特に大きな問題はありませんでした");
    expect(result.goodPoints).toBe("チームの連携がスムーズでした");

    expect(result.devProcesses).toEqual(["製造"]);

    expect(result.condition).toBe("GOOD");
    expect(result.motivation).toBe("EXCELLENT");
    expect(result.workload).toBe("NORMAL");
    expect(result.difficulty).toBe("SLIGHTLY_BAD");
    expect(result.teamConsultability).toBe("GOOD");
    expect(result.growth).toBe("BAD");

    expect(result.workAllocations).toEqual([
      { category: "実装", percentage: 50 },
      { category: "打ち合わせ", percentage: 50 },
    ]);

    // The only expected warning is the work-allocation equal-split notice —
    // every other field above should have been extracted cleanly.
    expect(result.warnings).toEqual([
      "作業配分の割合(%)は自動抽出できないため、項目名のみ引き継ぎ均等割りにしています。実際の割合に修正してください。",
    ]);
  });

  it("warns when 対象月 is missing instead of throwing", () => {
    const items = fullDocumentItems().filter((it) => it.text !== "対象月");
    const result = parseLegacyReport(items);
    expect(result.targetYear).toBeUndefined();
    expect(result.targetMonth).toBeUndefined();
    expect(result.warnings).toContain("「対象月」の項目が見つかりませんでした");
  });

  it("warns when 参画先企業 is missing", () => {
    const items = fullDocumentItems().filter((it) => it.text !== "参画先企業");
    const result = parseLegacyReport(items);
    expect(result.clientCompany).toBeUndefined();
    expect(result.warnings).toContain("「参画先企業」の項目が見つかりませんでした");
  });

  it("warns when the project name/work content header is missing", () => {
    const items = fullDocumentItems().filter((it) => it.text !== "プロジェクト名/作業内容");
    const result = parseLegacyReport(items);
    expect(result.projectName).toBeUndefined();
    expect(result.warnings).toContain("「プロジェクト名／作業内容」の項目が見つかりませんでした");
  });

  it("warns when no tech-stack category label is found", () => {
    const items = fullDocumentItems().filter(
      (it) => !["言語", "FW", "DB", "ソフトウェア/ツール", "OS/クラウド/開発環境"].includes(it.text),
    );
    const result = parseLegacyReport(items);
    expect(result.techStack).toBeUndefined();
    expect(result.warnings).toContain("技術スタックの項目が見つかりませんでした");
  });

  it("marks the project as not-ongoing when two period dates are present without '現在'", () => {
    const items: PdfTextItem[] = [
      item("期間", 50, 460),
      item("2024年4月", 60, 450),
      item("2026年3月", 60, 435),
      item("24ヶ月", 60, 420),
    ];
    const result = parseLegacyReport(items);
    expect(result.projectPeriodOngoing).toBe(false);
    expect(result.projectPeriodStartYear).toBe("2024");
    expect(result.projectPeriodStartMonth).toBe("4");
    expect(result.projectPeriodEndYear).toBe("2026");
    expect(result.projectPeriodEndMonth).toBe("3");
    expect(result.projectPeriodMonths).toBe("24");
  });

  it("returns only the warnings array (no crash) for a completely empty PDF", () => {
    const result = parseLegacyReport([]);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.targetYear).toBeUndefined();
    expect(result.techStack).toBeUndefined();
  });
});
