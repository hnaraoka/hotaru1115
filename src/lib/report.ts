export const REPORT_FIELDS = [
  "title",
  "year",
  "month",
  "author",
  "department",
  "summary",
  "achievements",
  "issues",
  "nextPlan",
  "notes",
] as const;

export type ReportInput = {
  title: string;
  year: number;
  month: number;
  author: string;
  department?: string | null;
  summary?: string | null;
  achievements?: string | null;
  issues?: string | null;
  nextPlan?: string | null;
  notes?: string | null;
};

export function parseReportInput(body: unknown): ReportInput {
  if (typeof body !== "object" || body === null) {
    throw new Error("リクエストボディが不正です");
  }
  const b = body as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  const author = typeof b.author === "string" ? b.author.trim() : "";
  const year = Number(b.year);
  const month = Number(b.month);

  if (!title) throw new Error("タイトルは必須です");
  if (!author) throw new Error("作成者は必須です");
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("対象年が不正です");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("対象月が不正です (1〜12)");
  }

  const optional = (key: keyof ReportInput): string | null => {
    const v = b[key];
    return typeof v === "string" && v.trim() !== "" ? v : null;
  };

  return {
    title,
    year,
    month,
    author,
    department: optional("department"),
    summary: optional("summary"),
    achievements: optional("achievements"),
    issues: optional("issues"),
    nextPlan: optional("nextPlan"),
    notes: optional("notes"),
  };
}
