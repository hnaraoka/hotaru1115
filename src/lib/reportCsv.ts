import type { Report, TechStackItem, WorkAllocation } from "@prisma/client";
import { ratingLabel, techCategoryLabel, reviewStatusLabel, formatProjectPeriod } from "@/lib/format";

// 管理者向けのCSV一括出力で使う列順。ストレージ逼迫時にデータを削除する前の
// 退避用途を想定し、Reportの全項目を1行にフラット化して出力する。
export const REPORT_CSV_HEADER = [
  "対象年",
  "対象月",
  "氏名",
  "ログインID",
  "提出日",
  "性別",
  "年齢",
  "経験年数",
  "参画先企業",
  "作業場所",
  "月間実労働日数",
  "月間実労働時間",
  "テレワーク日数",
  "現場日数",
  "プロジェクト名",
  "プロジェクト期間",
  "開発工程",
  "作業内容",
  "成果物",
  "困った点と対応・解決方法",
  "良かった点/改善提案",
  "体調",
  "モチベーション",
  "業務量",
  "業務難易度",
  "チーム内の相談しやすさ",
  "成長実感",
  "技術スタック",
  "作業配分",
  "レビュー状況",
  "レビューコメント",
  "レビュー日時",
  "レビューした管理者",
  "作成日時",
] as const;

export type ExportableReport = Report & {
  user: { name: string; loginId: string };
  techStackItems: TechStackItem[];
  workAllocations: WorkAllocation[];
};

function formatDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

function formatDateTime(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") : "";
}

export function reportToCsvRow(report: ExportableReport): string[] {
  return [
    String(report.targetYear),
    String(report.targetMonth),
    report.user.name,
    report.user.loginId,
    formatDate(report.submittedAt),
    report.gender ?? "",
    report.age != null ? String(report.age) : "",
    report.experienceYears != null ? String(report.experienceYears) : "",
    report.clientCompany,
    report.workLocation,
    report.workDays != null ? String(report.workDays) : "",
    report.workHours != null ? String(report.workHours) : "",
    report.teleworkDays != null ? String(report.teleworkDays) : "",
    report.onsiteDays != null ? String(report.onsiteDays) : "",
    report.projectName,
    formatProjectPeriod(report),
    report.devProcesses.join("、"),
    report.workContent,
    report.deliverables ?? "",
    report.troubles ?? "",
    report.goodPoints ?? "",
    ratingLabel(report.condition),
    ratingLabel(report.motivation),
    ratingLabel(report.workload),
    ratingLabel(report.difficulty),
    ratingLabel(report.teamConsultability),
    ratingLabel(report.growth),
    report.techStackItems.map((t) => `${techCategoryLabel(t.category)}:${t.name}`).join("、"),
    report.workAllocations.map((w) => `${w.category} ${w.percentage}%`).join("、"),
    reviewStatusLabel(report.reviewStatus),
    report.reviewComment ?? "",
    formatDateTime(report.reviewedAt),
    report.reviewedByName ?? "",
    formatDateTime(report.createdAt),
  ];
}
