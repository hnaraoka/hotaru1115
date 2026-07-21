import { RATING_OPTIONS, TECH_CATEGORY_OPTIONS } from "@/lib/constants";
import type { Report } from "@prisma/client";

export function ratingLabel(value: string | null): string {
  return RATING_OPTIONS.find((r) => r.value === value)?.label ?? "-";
}

export function techCategoryLabel(value: string): string {
  return TECH_CATEGORY_OPTIONS.find((c) => c.value === value)?.label ?? value;
}

export function reviewStatusLabel(status: string): string {
  switch (status) {
    case "APPROVED":
      return "承認済み";
    case "NEEDS_REVISION":
      return "差し戻し";
    default:
      return "未レビュー";
  }
}

export function reviewStatusColor(status: string): string {
  switch (status) {
    case "APPROVED":
      return "#16a34a";
    case "NEEDS_REVISION":
      return "var(--danger)";
    default:
      return "var(--muted)";
  }
}

export function formatProjectPeriod(report: Report): string {
  const start =
    report.projectPeriodStartYear && report.projectPeriodStartMonth
      ? `${report.projectPeriodStartYear}年${report.projectPeriodStartMonth}月`
      : "不明";
  const end = report.projectPeriodOngoing
    ? "現在"
    : report.projectPeriodEndYear && report.projectPeriodEndMonth
      ? `${report.projectPeriodEndYear}年${report.projectPeriodEndMonth}月`
      : "不明";
  const months = report.projectPeriodMonths ? `（${report.projectPeriodMonths}ヶ月）` : "";
  return `${start} 〜 ${end} ${months}`;
}
