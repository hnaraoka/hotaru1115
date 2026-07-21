import type { Report, TechStackItem } from "@prisma/client";

// 「極端に短い」とみなす文字数の目安。日本語の場合、これ未満だと
// 具体的な記述にならないことが多いための経験則。
const SHORT_TEXT_THRESHOLD = 10;

export type ReportForFlags = Pick<Report, "workContent" | "deliverables" | "troubles" | "goodPoints"> & {
  techStackItems: Pick<TechStackItem, "id">[];
};

/**
 * レビュー画面で管理者の目視確認を補助するための自動チェック。
 * 提出のブロックはしない（あくまで注意喚起）。
 */
export function computeReviewFlags(report: ReportForFlags): string[] {
  const flags: string[] = [];

  if (report.techStackItems.length === 0) {
    flags.push("技術スタックが未入力です");
  }
  if (!report.deliverables?.trim()) {
    flags.push("成果物が未入力です");
  }
  if (report.workContent.trim().length < SHORT_TEXT_THRESHOLD) {
    flags.push(`作業内容が${SHORT_TEXT_THRESHOLD}文字未満です`);
  }
  if (!report.troubles?.trim()) {
    flags.push("今月の困った点と対応・解決方法が未入力です");
  } else if (report.troubles.trim().length < SHORT_TEXT_THRESHOLD) {
    flags.push(`今月の困った点と対応・解決方法が${SHORT_TEXT_THRESHOLD}文字未満です`);
  }
  if (!report.goodPoints?.trim()) {
    flags.push("今月の良かった点/改善提案などが未入力です");
  } else if (report.goodPoints.trim().length < SHORT_TEXT_THRESHOLD) {
    flags.push(`今月の良かった点/改善提案などが${SHORT_TEXT_THRESHOLD}文字未満です`);
  }

  return flags;
}
