import ExcelJS from "exceljs";
import { DEV_PROCESS_OPTIONS, TECH_CATEGORY_OPTIONS } from "@/lib/constants";
import type { TechCategoryValue } from "@/lib/constants";
import type { ParsedReportFields } from "@/lib/pdfImport/parseLegacyReport";
import { normalizeRatingLabel } from "@/lib/reportImport/ratingLabels";

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
const TECH_COLUMNS = ["G", "N", "U", "AB"];

const DEV_PROCESS_COLUMNS = ["Z", "AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH"];

const WORK_ALLOCATION_FIRST_ROW = 49;
const WORK_ALLOCATION_MAX_ROWS = 30;

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

  const targetMonth = cellYearMonth(ws, "Z4");
  if (targetMonth) {
    result.targetYear = targetMonth.year;
    result.targetMonth = targetMonth.month;
  } else {
    warnings.push("対象月を読み取れませんでした");
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

  const techStack: Record<TechCategoryValue, string[]> = {
    LANGUAGE: [],
    FRAMEWORK: [],
    DATABASE: [],
    TOOL: [],
    OS_ENV: [],
  };
  for (const { value } of TECH_CATEGORY_OPTIONS) {
    const row = TECH_ROW_BY_CATEGORY[value];
    const names: string[] = [];
    for (const rowOffset of [0, 1]) {
      for (const col of TECH_COLUMNS) {
        const name = cellText(ws, `${col}${row + rowOffset}`);
        if (name) names.push(name);
      }
    }
    techStack[value] = names;
  }
  result.techStack = techStack;

  const periodStart = cellYearMonth(ws, "B27");
  if (periodStart) {
    result.projectPeriodStartYear = String(periodStart.year);
    result.projectPeriodStartMonth = String(periodStart.month);
  }
  const ongoingCellText = cellText(ws, "B31");
  result.projectPeriodOngoing = ongoingCellText === "現在";
  if (!result.projectPeriodOngoing) {
    const periodEnd = cellYearMonth(ws, "B31");
    if (periodEnd) {
      result.projectPeriodEndYear = String(periodEnd.year);
      result.projectPeriodEndMonth = String(periodEnd.month);
    }
  }
  result.projectPeriodMonths = parseLeadingNumber(String(cellNumber(ws, "B34") ?? ""));

  result.projectName = cellText(ws, "G27");
  result.workContent = cellText(ws, "G28");
  if (!result.projectName && !result.workContent) {
    warnings.push("プロジェクト名・作業内容を読み取れませんでした");
  }

  result.devProcesses = DEV_PROCESS_OPTIONS.filter((_, i) => {
    const col = DEV_PROCESS_COLUMNS[i];
    const mark = cellText(ws, `${col}31`);
    return mark === "〇" || mark === "○";
  });

  result.deliverables = cellText(ws, "G35");
  result.troubles = cellText(ws, "G38");
  result.goodPoints = cellText(ws, "G41");

  const ratingCells: { key: keyof ParsedReportFields; ref: string }[] = [
    { key: "condition", ref: "G44" },
    { key: "motivation", ref: "G46" },
    { key: "workload", ref: "G48" },
    { key: "difficulty", ref: "G50" },
    { key: "teamConsultability", ref: "G52" },
    { key: "growth", ref: "G54" },
  ];
  for (const { key, ref } of ratingCells) {
    const normalized = normalizeRatingLabel(cellText(ws, ref));
    if (normalized) (result as Record<string, unknown>)[key] = normalized;
  }

  const workAllocations: { category: string; percentage: number }[] = [];
  for (let i = 0; i < WORK_ALLOCATION_MAX_ROWS; i++) {
    const row = WORK_ALLOCATION_FIRST_ROW + i;
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
