export const DEV_PROCESS_OPTIONS = [
  "顧客折衝",
  "要件定義",
  "基本設計",
  "詳細設計",
  "製造",
  "単体テスト",
  "結合テスト",
  "総合テスト",
  "保守・運用",
] as const;

export const TECH_CATEGORY_OPTIONS = [
  { value: "LANGUAGE", label: "言語" },
  { value: "FRAMEWORK", label: "FW" },
  { value: "DATABASE", label: "DB" },
  { value: "TOOL", label: "ソフトウェア/ツール" },
  { value: "OS_ENV", label: "OS/クラウド/開発環境" },
] as const;

export type TechCategoryValue = (typeof TECH_CATEGORY_OPTIONS)[number]["value"];

export const RATING_OPTIONS = [
  { value: "EXCELLENT", label: "大変良い" },
  { value: "GOOD", label: "良い" },
  { value: "NORMAL", label: "普通" },
  { value: "SLIGHTLY_BAD", label: "やや悪い" },
  { value: "BAD", label: "悪い" },
] as const;

export type RatingValue = (typeof RATING_OPTIONS)[number]["value"];

export const RATING_FIELDS = [
  { key: "condition", label: "体調" },
  { key: "motivation", label: "モチベーション" },
  { key: "workload", label: "業務量" },
  { key: "difficulty", label: "業務難易度" },
  { key: "teamConsultability", label: "チーム内の相談しやすさ" },
  { key: "growth", label: "成長実感" },
] as const;

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
