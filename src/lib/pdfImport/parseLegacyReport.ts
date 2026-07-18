import { DEV_PROCESS_OPTIONS, RATING_OPTIONS } from "@/lib/constants";
import type { TechCategoryValue } from "@/lib/constants";
import type { PdfTextItem } from "@/lib/pdfImport/extractTextItems";

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

const Y_TOLERANCE_SAME_ROW = 3;
const X_VALUE_GAP = 8;

function findLabel(items: PdfTextItem[], text: string): PdfTextItem | undefined {
  return items.find((it) => it.text.trim() === text);
}

function findLabelStartingWith(items: PdfTextItem[], prefix: string): PdfTextItem | undefined {
  return items.find((it) => it.text.trim().startsWith(prefix));
}

/** Value positioned to the right of a label, on (roughly) the same baseline. */
function valueRightOf(items: PdfTextItem[], label: PdfTextItem, maxGap = 400): string | undefined {
  const candidates = items
    .filter(
      (it) =>
        it !== label &&
        Math.abs(it.y - label.y) <= Y_TOLERANCE_SAME_ROW &&
        it.x > label.x + label.width - 2 &&
        it.x - (label.x + label.width) < maxGap,
    )
    .sort((a, b) => a.x - b.x);
  return candidates[0]?.text.trim();
}

/** Value positioned directly below a label, roughly the same x column. */
function valueBelow(items: PdfTextItem[], label: PdfTextItem, maxDrop = 20): string | undefined {
  const candidates = items
    .filter(
      (it) =>
        it !== label &&
        it.y < label.y - 1 &&
        label.y - it.y < maxDrop &&
        Math.abs(it.x - label.x) < 40,
    )
    .sort((a, b) => b.y - a.y);
  return candidates[0]?.text.trim();
}

function parseYearMonth(text: string | undefined): { year: number; month: number } | undefined {
  if (!text) return undefined;
  const m = text.match(/(\d{4})年\s*(\d{1,2})月/);
  if (!m) return undefined;
  return { year: Number(m[1]), month: Number(m[2]) };
}

function parseYears(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const m = text.match(/(\d+(?:\.\d+)?)\s*年/);
  return m ? m[1] : undefined;
}

function parseNumberWithUnit(text: string | undefined, unit: string): string | undefined {
  if (!text) return undefined;
  const m = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}`));
  return m ? m[1] : undefined;
}

export function parseLegacyReport(items: PdfTextItem[]): ParsedReportFields {
  const warnings: string[] = [];
  const result: ParsedReportFields = { warnings };

  // --- 対象月 / 経験年数 (same row as their labels) ---
  const targetMonthLabel = findLabel(items, "対象月");
  if (targetMonthLabel) {
    const parsed = parseYearMonth(valueRightOf(items, targetMonthLabel));
    if (parsed) {
      result.targetYear = parsed.year;
      result.targetMonth = parsed.month;
    } else {
      warnings.push("対象月を読み取れませんでした");
    }
  } else {
    warnings.push("「対象月」の項目が見つかりませんでした");
  }

  const experienceLabel = findLabel(items, "経験年数");
  if (experienceLabel) {
    result.experienceYears = parseYears(valueRightOf(items, experienceLabel));
  }

  // --- 性別 / 年齢 (value below the label) ---
  const genderLabel = findLabel(items, "性別");
  if (genderLabel) result.gender = valueBelow(items, genderLabel);

  const ageLabel = findLabel(items, "年齢");
  if (ageLabel) {
    const raw = valueBelow(items, ageLabel);
    result.age = raw?.match(/\d+/)?.[0];
  }

  // --- 参画先企業 / 作業場所 (same row) ---
  const clientLabel = findLabel(items, "参画先企業");
  if (clientLabel) {
    result.clientCompany = valueRightOf(items, clientLabel);
  } else {
    warnings.push("「参画先企業」の項目が見つかりませんでした");
  }

  const locationLabel = findLabel(items, "作業場所");
  if (locationLabel) result.workLocation = valueRightOf(items, locationLabel);

  // --- 月間実労働: 日数/時間/テレワーク/現場 (mini labels, same row) ---
  const daysLabel = findLabel(items, "日数");
  if (daysLabel) result.workDays = parseNumberWithUnit(valueRightOf(items, daysLabel, 60), "日");

  const hoursLabel = findLabel(items, "時間");
  if (hoursLabel) result.workHours = parseNumberWithUnit(valueRightOf(items, hoursLabel, 60), "時間");

  const teleworkLabel = findLabel(items, "テレワーク");
  if (teleworkLabel) result.teleworkDays = parseNumberWithUnit(valueRightOf(items, teleworkLabel, 60), "日");

  const onsiteLabel = findLabel(items, "現場");
  if (onsiteLabel) result.onsiteDays = parseNumberWithUnit(valueRightOf(items, onsiteLabel, 60), "日");

  // --- 技術スタック: 5 category bands, each item cell split on "/" ---
  const techLabelTexts: { value: TechCategoryValue; labels: string[] }[] = [
    { value: "LANGUAGE", labels: ["言語"] },
    { value: "FRAMEWORK", labels: ["FW"] },
    { value: "DATABASE", labels: ["DB"] },
    { value: "TOOL", labels: ["ソフトウェア/ツール", "ソフトウェア／ツール"] },
    { value: "OS_ENV", labels: ["OS/クラウド/開発環境", "OS／クラウド／開発環境"] },
  ];
  const techLabelItems = techLabelTexts
    .map((entry) => {
      const item = entry.labels.map((l) => findLabel(items, l)).find(Boolean);
      return item ? { ...entry, item } : null;
    })
    .filter((v): v is { value: TechCategoryValue; labels: string[]; item: PdfTextItem } => v !== null)
    .sort((a, b) => b.item.y - a.item.y);

  const nameHeader = findLabel(items, "名称");

  if (techLabelItems.length > 0) {
    const techStack: Record<TechCategoryValue, string[]> = {
      LANGUAGE: [],
      FRAMEWORK: [],
      DATABASE: [],
      TOOL: [],
      OS_ENV: [],
    };

    // Shared boundaries between adjacent category bands (each computed once,
    // as the midpoint between the two labels either side of it) so bands can
    // never overlap and leak an item into two categories at once.
    const boundaries = techLabelItems.map((entry, i) => {
      const upper = i === 0 ? (nameHeader?.y ?? entry.item.y + 40) : (entry.item.y + techLabelItems[i - 1].item.y) / 2;
      const lower =
        i === techLabelItems.length - 1
          ? entry.item.y - 40
          : (entry.item.y + techLabelItems[i + 1].item.y) / 2;
      return { upper, lower };
    });

    techLabelItems.forEach((entry, i) => {
      const { upper, lower } = boundaries[i];
      const cellItems = items.filter(
        (it) => it.x > entry.item.x + entry.item.width + X_VALUE_GAP && it.y < upper && it.y >= lower,
      );

      const names = cellItems.flatMap((it) =>
        it.text
          .split("/")
          .map((s) => s.trim())
          .filter(Boolean),
      );
      techStack[entry.value] = names;
    });

    result.techStack = techStack;
  } else {
    warnings.push("技術スタックの項目が見つかりませんでした");
  }

  // --- プロジェクト: 期間 / プロジェクト名・作業内容 / 開発工程 ---
  const periodLabel = findLabel(items, "期間");
  const projectHeader = findLabelStartingWith(items, "プロジェクト名");
  const devProcessHeader = findLabel(items, "開発工程");

  if (periodLabel) {
    const periodItems = items
      .filter((it) => it.x < 120 && it.y < periodLabel.y + 20 && it !== periodLabel)
      .sort((a, b) => b.y - a.y);

    const dateItems = periodItems.filter((it) => /\d{4}年\d{1,2}月/.test(it.text));
    const isOngoing = periodItems.some((it) => it.text.includes("現在"));
    const durationItem = periodItems.find((it) => /\d+\s*ヶ月/.test(it.text));

    const start = parseYearMonth(dateItems[0]?.text);
    if (start) {
      result.projectPeriodStartYear = String(start.year);
      result.projectPeriodStartMonth = String(start.month);
    }
    result.projectPeriodOngoing = isOngoing || dateItems.length < 2;
    if (!result.projectPeriodOngoing) {
      const end = parseYearMonth(dateItems[1]?.text);
      if (end) {
        result.projectPeriodEndYear = String(end.year);
        result.projectPeriodEndMonth = String(end.month);
      }
    }
    if (durationItem) {
      result.projectPeriodMonths = durationItem.text.match(/\d+/)?.[0];
    }
  }

  // Bullet items (e.g. "・WBS管理表") are only ever used for the 成果物 list in
  // this template, so they can be found directly rather than via a y-band —
  // which matters because 成果物's label sits *between* its own bullets
  // (same "label centered in its content" pattern as the tech-stack labels).
  const deliverableBullets = items
    .filter((it) => it.x < 300 && /^[・]/.test(it.text.trim()))
    .sort((a, b) => b.y - a.y);

  if (projectHeader) {
    // Work content stops just above the first 成果物 bullet (if any exist),
    // otherwise falls back to a generous default span.
    const lowerLimit = deliverableBullets.length > 0 ? deliverableBullets[0].y + 3 : projectHeader.y - 170;
    const contentItems = items
      .filter((it) => it.x >= 120 && it.x < 400 && it.y < projectHeader.y && it.y > lowerLimit && it !== projectHeader)
      .sort((a, b) => b.y - a.y);

    if (contentItems.length > 0) {
      result.projectName = contentItems[0].text.trim();
      result.workContent = contentItems
        .slice(1)
        .map((it) => it.text.replace(/^[　●・]+/, "").trim())
        .filter(Boolean)
        .join("\n");
    } else {
      warnings.push("プロジェクト名・作業内容を読み取れませんでした");
    }
  } else {
    warnings.push("「プロジェクト名／作業内容」の項目が見つかりませんでした");
  }

  if (devProcessHeader) {
    // Each dev-process column header is drawn as single characters stacked
    // vertically; group them by x to recover each column's label and x-range.
    const headerChars = items.filter(
      (it) => it.x > 400 && it.y < devProcessHeader.y && it.y > devProcessHeader.y - 60 && it.text.length <= 2,
    );
    const columns = new Map<number, PdfTextItem[]>();
    for (const ch of headerChars) {
      const colX = Math.round(ch.x / 5) * 5;
      const bucket = columns.get(colX) ?? [];
      bucket.push(ch);
      columns.set(colX, bucket);
    }

    const columnLabels = Array.from(columns.entries())
      .map(([x, chars]) => ({
        x,
        text: chars
          .sort((a, b) => b.y - a.y)
          .map((c) => c.text)
          .join(""),
      }))
      .sort((a, b) => a.x - b.x);

    const checkmarks = items.filter(
      (it) => (it.text === "〇" || it.text === "○") && it.x > 400 && it.y < devProcessHeader.y,
    );

    const selected: string[] = [];
    for (const option of DEV_PROCESS_OPTIONS) {
      const col = columnLabels.find((c) => c.text === option || option.startsWith(c.text));
      if (!col) continue;
      const hasCheck = checkmarks.some((mark) => Math.abs(mark.x - col.x) < 10);
      if (hasCheck) selected.push(option);
    }
    result.devProcesses = selected;
  }

  // --- 成果物: the bullet items found above, directly ---
  if (deliverableBullets.length > 0) {
    result.deliverables = deliverableBullets.map((it) => it.text.replace(/^[・]/, "").trim()).join("\n");
  }

  // --- 困った点 / 良かった点: both are two-line labels whose paragraph content
  // is interleaved between the two label lines (e.g. line1, content1, line2,
  // content2). Build each band from the label pair's own y-span plus a small
  // margin, which keeps it tight enough not to bleed into neighboring
  // sections.
  const troublesLabel1 = findLabelStartingWith(items, "今月の困った点");
  const troublesLabel2 = findLabel(items, "対応・解決方法");
  const goodPointsLabel1 = findLabelStartingWith(items, "今月の良かった点");
  const goodPointsLabel2 = findLabel(items, "改善提案など");

  function collectLabelPairBand(label1: PdfTextItem | undefined, label2: PdfTextItem | undefined): string | undefined {
    if (!label1) return undefined;
    const ys = [label1.y, label2?.y ?? label1.y];
    const top = Math.max(...ys) + 12;
    const bottom = Math.min(...ys) - 10;
    // These fields are a single wrapped paragraph in the source template
    // (not a bullet list), so join without a separator — otherwise a word
    // that happened to wrap mid-line (e.g. "…行ったが、業" / "務仕様が…")
    // would end up with a stray line break in the middle of it.
    return items
      .filter(
        (it) =>
          it.x >= 118 &&
          it.x < 550 &&
          it.y < top &&
          it.y > bottom &&
          it !== label1 &&
          it !== label2 &&
          it.width > 60,
      )
      .sort((a, b) => b.y - a.y)
      .map((it) => it.text.trim())
      .filter(Boolean)
      .join("");
  }

  result.troubles = collectLabelPairBand(troublesLabel1, troublesLabel2);
  result.goodPoints = collectLabelPairBand(goodPointsLabel1, goodPointsLabel2);

  // --- 自己評価 (same row as each label) ---
  const ratingLabelMap: { key: keyof ParsedReportFields; text: string }[] = [
    { key: "condition", text: "体調" },
    { key: "motivation", text: "モチベーション" },
    { key: "workload", text: "業務量" },
    { key: "difficulty", text: "業務難易度" },
    { key: "teamConsultability", text: "チーム内の相談しやすさ" },
    { key: "growth", text: "成長実感" },
  ];
  for (const { key, text } of ratingLabelMap) {
    const label = findLabel(items, text);
    if (!label) continue;
    const raw = valueRightOf(items, label, 180);
    const match = RATING_OPTIONS.find((opt) => opt.label === raw);
    if (match) (result as Record<string, unknown>)[key] = match.value;
  }

  // --- 作業配分: legend category names (percentages require manual entry) ---
  const workAllocationLabel = findLabel(items, "作業配分");
  if (workAllocationLabel) {
    const legendItems = items.filter(
      (it) =>
        it.x > workAllocationLabel.x + 100 &&
        it.y < workAllocationLabel.y + 90 &&
        it.y > workAllocationLabel.y - 90 &&
        !/%/.test(it.text) &&
        it.text.trim() !== "作業配分",
    );
    if (legendItems.length > 0) {
      const equalShare = Math.round(100 / legendItems.length);
      result.workAllocations = legendItems.map((it, i) => ({
        category: it.text.trim(),
        percentage: i === legendItems.length - 1 ? 100 - equalShare * (legendItems.length - 1) : equalShare,
      }));
      warnings.push(
        "作業配分の割合(%)は自動抽出できないため、項目名のみ引き継ぎ均等割りにしています。実際の割合に修正してください。",
      );
    }
  }

  return result;
}
