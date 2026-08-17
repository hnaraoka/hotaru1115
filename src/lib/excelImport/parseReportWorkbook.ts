import ExcelJS from "exceljs";
import { DEV_PROCESS_OPTIONS, TECH_CATEGORY_OPTIONS } from "@/lib/constants";
import type { TechCategoryValue } from "@/lib/constants";
import { normalizeRatingLabel } from "@/lib/reportImport/ratingLabels";

export type ParsedReportFields = {
  targetYear?: number;
  targetMonth?: number;
  gender?: string;
  age?: string;
  experienceYears?: string;
  clientCompany?: string;
  workLocation?: string;
  workDays?: string;
  workHours?: string;
  teleworkDays?: string;
  onsiteDays?: string;
  projectName?: string;
  projectPeriodStartYear?: string;
  projectPeriodStartMonth?: string;
  projectPeriodOngoing?: boolean;
  projectPeriodEndYear?: string;
  projectPeriodEndMonth?: string;
  projectPeriodMonths?: string;
  workContent?: string;
  devProcesses?: string[];
  deliverables?: string;
  troubles?: string;
  goodPoints?: string;
  condition?: string;
  motivation?: string;
  workload?: string;
  difficulty?: string;
  teamConsultability?: string;
  growth?: string;
  techStack?: Record<TechCategoryValue, string[]>;
  workAllocations?: { category: string; percentage: number }[];
  /** Fields we could not confidently extract, for surfacing a warning to the user. */
  warnings: string[];
};

const SHEET_NAME = "職務経歴";

// Excelのシリアル値の起点（1900年うるう年バグを踏まえた基準日）。
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);

function excelSerialToDate(serial: number): Date {
  return new Date(EXCEL_EPOCH_MS + serial * 86400000);
}

/** 数式セルは {formula, result} を返すため、実値だけを取り出す。 */
function resolve(value: ExcelJS.CellValue): string | number | Date | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object" && "result" in value) {
    const result = (value as { result: unknown }).result;
    return typeof result === "string" || typeof result === "number" || result instanceof Date
      ? result
      : undefined;
  }
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) return value;
  return undefined;
}

function cellText(ws: ExcelJS.Worksheet, ref: string): string | undefined {
  const value = resolve(ws.getCell(ref).value);
  if (value === undefined) return undefined;
  const text = value instanceof Date ? undefined : String(value).trim();
  return text ? text : undefined;
}

function cellNumber(ws: ExcelJS.Worksheet, ref: string): number | undefined {
  const value = resolve(ws.getCell(ref).value);
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** 「年月のみ」の日付書式のセル（対象月・プロジェクト期間）。数値ならExcelシリアル値として扱う。 */
function cellYearMonth(ws: ExcelJS.Worksheet, ref: string): { year: number; month: number } | undefined {
  const value = resolve(ws.getCell(ref).value);
  const date = value instanceof Date ? value : typeof value === "number" ? excelSerialToDate(value) : undefined;
  if (!date) return undefined;
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function parseLeadingNumber(text: string | undefined): string | undefined {
  return text?.match(/\d+(?:\.\d+)?/)?.[0];
}

const TECH_ROW_BY_CATEGORY: Record<TechCategoryValue, number> = {
  LANGUAGE: 12,
  FRAMEWORK: 14,
  DATABASE: 16,
  TOOL: 18,
  OS_ENV: 20,
};
const TECH_LABEL_COLUMN = "B";
const TECH_COLUMNS = ["G", "N", "U", "AB"];
// A category's row band is normally 2 rows, but rows are sometimes inserted
// by hand (e.g. an extra ソフトウェア/ツール row). How far past a category's
// expected start we're willing to scan for the *next* category's label
// before giving up and falling back to the fixed 2-row assumption.
const TECH_LABEL_SEARCH_WINDOW = 12;
// Baseline last row of the 名称 table (OS_ENV's row + 1), used to compute how
// many extra rows were inserted so every fixed row reference below the table
// can shift down by the same amount.
const BASE_TECH_TABLE_LAST_ROW = TECH_ROW_BY_CATEGORY.OS_ENV + 1;

const DEV_PROCESS_COLUMNS = ["Z", "AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH"];

const WORK_ALLOCATION_FIRST_ROW = 49;
const WORK_ALLOCATION_MAX_ROWS = 30;

function findLabelRow(ws: ExcelJS.Worksheet, label: string, fromRow: number): number | undefined {
  for (let row = fromRow; row < fromRow + TECH_LABEL_SEARCH_WINDOW; row++) {
    if (cellText(ws, `${TECH_LABEL_COLUMN}${row}`) === label) return row;
  }
  return undefined;
}

/**
 * 「名称」テーブルの各カテゴリは基本2行だが、テンプレートに手作業で行が
 * 追加されるケースがある。次のカテゴリ見出しが実際に見つかった行を境界に
 * 使うことで、行数を動的に判定する。見出しが見つからない場合（見出し列を
 * 持たない簡易ワークブックなど）は従来通り2行固定にフォールバックする。
 */
function resolveTechCategoryRowRanges(
  ws: ExcelJS.Worksheet,
): Record<TechCategoryValue, { start: number; end: number }> {
  const ranges = {} as Record<TechCategoryValue, { start: number; end: number }>;
  let cursor = TECH_ROW_BY_CATEGORY[TECH_CATEGORY_OPTIONS[0].value];

  TECH_CATEGORY_OPTIONS.forEach(({ value, label }, i) => {
    const expectedStart = TECH_ROW_BY_CATEGORY[value];
    const start = findLabelRow(ws, label, cursor) ?? Math.max(cursor, expectedStart);
    const next = TECH_CATEGORY_OPTIONS[i + 1];
    const nextStart = next ? findLabelRow(ws, next.label, start + 1) : undefined;
    const end = nextStart ? nextStart - 1 : start + 1;
    ranges[value] = { start, end };
    cursor = end + 1;
  });

  return ranges;
}

export function parseReportWorkbook(workbook: ExcelJS.Workbook): ParsedReportFields {
  const warnings: string[] = [];
  const result: ParsedReportFields = { warnings };

  const ws = workbook.getWorksheet(SHEET_NAME) ?? workbook.worksheets[0];
  if (!ws) {
    warnings.push("シートが見つかりませんでした");
    return result;
  }
  if (!(cellText(ws, "B2") ?? "").includes("月次報告書")) {
    warnings.push("テンプレートの形式が想定と異なる可能性があります。読み込んだ内容を確認してください。");
  }

  // 対象年月はフォーム側で使わない（画面表示時点の値を維持する）ため、
  // 読み取れなかった場合の警告は出さない。
  const targetMonth = cellYearMonth(ws, "Z4");
  if (targetMonth) {
    result.targetYear = targetMonth.year;
    result.targetMonth = targetMonth.month;
  }
  result.experienceYears = parseLeadingNumber(cellText(ws, "Z5"));

  result.gender = cellText(ws, "O5");
  result.age = parseLeadingNumber(String(cellNumber(ws, "S5") ?? ""));

  result.clientCompany = cellText(ws, "G7");
  if (!result.clientCompany) warnings.push("「参画先企業」の項目が見つかりませんでした");
  result.workLocation = cellText(ws, "G8");

  result.workDays = parseLeadingNumber(cellText(ws, "J9"));
  result.workHours = parseLeadingNumber(cellText(ws, "Q9"));
  result.teleworkDays = parseLeadingNumber(cellText(ws, "X9"));
  result.onsiteDays = parseLeadingNumber(cellText(ws, "AE9"));

  const techCategoryRanges = resolveTechCategoryRowRanges(ws);
  const techStack: Record<TechCategoryValue, string[]> = {
    LANGUAGE: [],
    FRAMEWORK: [],
    DATABASE: [],
    TOOL: [],
    OS_ENV: [],
  };
  for (const { value } of TECH_CATEGORY_OPTIONS) {
    const { start, end } = techCategoryRanges[value];
    const names: string[] = [];
    for (let row = start; row <= end; row++) {
      for (const col of TECH_COLUMNS) {
        const name = cellText(ws, `${col}${row}`);
        if (name) names.push(name);
      }
    }
    techStack[value] = names;
  }
  result.techStack = techStack;

  // 「名称」テーブルに行が追加された分だけ、以降の固定行参照を下にずらす。
  const rowShift = techCategoryRanges.OS_ENV.end - BASE_TECH_TABLE_LAST_ROW;
  const shiftedRow = (row: number) => row + rowShift;

  const periodStart = cellYearMonth(ws, `B${shiftedRow(27)}`);
  if (periodStart) {
    result.projectPeriodStartYear = String(periodStart.year);
    result.projectPeriodStartMonth = String(periodStart.month);
  }
  const ongoingCellText = cellText(ws, `B${shiftedRow(31)}`);
  result.projectPeriodOngoing = ongoingCellText === "現在";
  if (!result.projectPeriodOngoing) {
    const periodEnd = cellYearMonth(ws, `B${shiftedRow(31)}`);
    if (periodEnd) {
      result.projectPeriodEndYear = String(periodEnd.year);
      result.projectPeriodEndMonth = String(periodEnd.month);
    }
  }
  result.projectPeriodMonths = parseLeadingNumber(String(cellNumber(ws, `B${shiftedRow(34)}`) ?? ""));

  result.projectName = cellText(ws, `G${shiftedRow(27)}`);
  result.workContent = cellText(ws, `G${shiftedRow(28)}`);
  if (!result.projectName && !result.workContent) {
    warnings.push("プロジェクト名・作業内容を読み取れませんでした");
  }

  result.devProcesses = DEV_PROCESS_OPTIONS.filter((_, i) => {
    const col = DEV_PROCESS_COLUMNS[i];
    const mark = cellText(ws, `${col}${shiftedRow(31)}`);
    return mark === "〇" || mark === "○";
  });

  result.deliverables = cellText(ws, `G${shiftedRow(35)}`);
  result.troubles = cellText(ws, `G${shiftedRow(38)}`);
  result.goodPoints = cellText(ws, `G${shiftedRow(41)}`);

  const ratingCells: { key: keyof ParsedReportFields; row: number }[] = [
    { key: "condition", row: 44 },
    { key: "motivation", row: 46 },
    { key: "workload", row: 48 },
    { key: "difficulty", row: 50 },
    { key: "teamConsultability", row: 52 },
    { key: "growth", row: 54 },
  ];
  for (const { key, row } of ratingCells) {
    const normalized = normalizeRatingLabel(cellText(ws, `G${shiftedRow(row)}`));
    if (normalized) (result as Record<string, unknown>)[key] = normalized;
  }

  const workAllocations: { category: string; percentage: number }[] = [];
  for (let i = 0; i < WORK_ALLOCATION_MAX_ROWS; i++) {
    const row = shiftedRow(WORK_ALLOCATION_FIRST_ROW) + i;
    const category = cellText(ws, `AL${row}`);
    if (!category || category === "計") break;
    const percentage = cellNumber(ws, `AM${row}`);
    if (percentage === undefined) continue;
    workAllocations.push({ category, percentage: Math.round(percentage) });
  }
  if (workAllocations.length > 0) {
    result.workAllocations = workAllocations;
  } else {
    warnings.push("作業配分の項目が見つかりませんでした");
  }

  return result;
}
