import { describe, expect, it } from "vitest";
import { computeReviewFlags, type ReportForFlags } from "@/lib/reportFlags";

function baseReport(overrides: Partial<ReportForFlags> = {}): ReportForFlags {
  return {
    workContent: "設計・実装・テストを一通り担当しました",
    deliverables: "設計書一式",
    troubles: "特に大きな問題はありませんでした",
    goodPoints: "チームの連携がスムーズでした",
    techStackItems: [{ id: "1" }],
    ...overrides,
  };
}

describe("computeReviewFlags", () => {
  it("returns no flags for a complete report", () => {
    expect(computeReviewFlags(baseReport())).toEqual([]);
  });

  it("flags missing tech stack items", () => {
    const flags = computeReviewFlags(baseReport({ techStackItems: [] }));
    expect(flags).toContain("技術スタックが未入力です");
  });

  it("flags missing deliverables", () => {
    const flags = computeReviewFlags(baseReport({ deliverables: null }));
    expect(flags).toContain("成果物が未入力です");
  });

  it("flags whitespace-only deliverables as missing", () => {
    const flags = computeReviewFlags(baseReport({ deliverables: "   " }));
    expect(flags).toContain("成果物が未入力です");
  });

  it("flags short workContent", () => {
    const flags = computeReviewFlags(baseReport({ workContent: "短い" }));
    expect(flags).toContain("作業内容が10文字未満です");
  });

  it("flags missing troubles distinctly from short troubles", () => {
    expect(computeReviewFlags(baseReport({ troubles: null }))).toContain(
      "今月の困った点と対応・解決方法が未入力です",
    );
    expect(computeReviewFlags(baseReport({ troubles: "短い" }))).toContain(
      "今月の困った点と対応・解決方法が10文字未満です",
    );
  });

  it("flags missing goodPoints distinctly from short goodPoints", () => {
    expect(computeReviewFlags(baseReport({ goodPoints: null }))).toContain(
      "今月の良かった点/改善提案などが未入力です",
    );
    expect(computeReviewFlags(baseReport({ goodPoints: "短い" }))).toContain(
      "今月の良かった点/改善提案などが10文字未満です",
    );
  });
});
