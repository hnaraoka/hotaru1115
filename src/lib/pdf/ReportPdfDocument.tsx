import path from "node:path";
import { Document, Font, Page, StyleSheet, Svg, Path as SvgPath, Text, View } from "@react-pdf/renderer";
import type { Report, TechStackItem, User, WorkAllocation } from "@prisma/client";
import { DEV_PROCESS_OPTIONS, RATING_FIELDS, TECH_CATEGORY_OPTIONS } from "@/lib/constants";
import { ratingLabel } from "@/lib/format";
import { CATEGORICAL_PALETTE, foldToPaletteSlots } from "@/lib/pdf/colors";
import { buildPieSlices } from "@/lib/pdf/pieChart";

Font.register({
  family: "NotoSansJP",
  fonts: [
    { src: path.join(process.cwd(), "src/fonts/NotoSansJP-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "src/fonts/NotoSansJP-Bold.ttf"), fontWeight: "bold" },
  ],
});
// react-pdf only finds line-break opportunities inside a run of same-script
// text (e.g. an all-hiragana or all-kanji stretch) at Unicode *script*
// transitions — it has no general "wrap anywhere" behavior for CJK. A long
// paragraph that happens to stay within one script (common for hiragana-only
// stretches) would otherwise never wrap and silently overflow the page.
// Force per-character break opportunities for any non-ASCII "word" so
// Japanese free text (作業内容/成果物/所感 etc.) always wraps; leave ASCII
// words (tech stack tag names, etc.) untouched to avoid ugly English
// dictionary hyphenation mid-word. This still allows a "-" glyph to appear
// at a forced wrap point, same as elsewhere in the document.
Font.registerHyphenationCallback((word) => {
  if (/^[\x00-\x7F]*$/.test(word)) return [word];
  return Array.from(word);
});

const BORDER = "0.75pt solid #555555";
const LABEL_BG = "#dceadb";
const DEV_COL_WIDTH = 26;
const PERIOD_LABEL_WIDTH = 42;
const PERIOD_VALUE_WIDTH = 78;
const PROJECT_LABEL_WIDTH = 130;

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 8.5,
    padding: 24,
    color: "#1a1a1a",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  titleSpacer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  submittedAt: {
    flex: 1,
    fontSize: 8,
    color: "#444444",
    textAlign: "right",
  },
  table: {
    border: BORDER,
    borderBottom: "none",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    borderBottom: BORDER,
  },
  labelCell: {
    backgroundColor: LABEL_BG,
    fontWeight: "bold",
    fontSize: 7.5,
    padding: 4,
    borderRight: BORDER,
    justifyContent: "center",
    alignItems: "center",
  },
  valueCell: {
    padding: 4,
    borderRight: BORDER,
    justifyContent: "center",
  },
  valueCellLast: {
    padding: 4,
    justifyContent: "center",
  },
  centerText: {
    textAlign: "center",
  },
  sectionHeading: {
    fontWeight: "bold",
    fontSize: 9,
    textAlign: "center",
  },
  bodyText: {
    fontSize: 8.5,
    lineHeight: 1.5,
  },
});

// Shortened, kanji-only labels for the narrow dev-process columns. Avoids
// labels like "単体テスト" that mix kanji and katakana — react-pdf's
// line-breaker inserts a stray "-" whenever a wrap is forced exactly at that
// script boundary.
const DEV_PROCESS_PDF_LABELS: Record<string, string> = {
  顧客折衝: "顧客折衝",
  要件定義: "要件定義",
  基本設計: "基本設計",
  詳細設計: "詳細設計",
  製造: "製造",
  単体テスト: "単体",
  結合テスト: "結合",
  総合テスト: "総合",
  "保守・運用": "保守運用",
};

// react-pdf's <View> cannot render raw text nodes directly — any string/number
// (including the arrays JSX produces for `{a}年{b}月`-style interpolation) must
// be wrapped in a <Text>. Only skip wrapping when the child is already a real
// element (e.g. an explicit <Text>/<View> passed in by the caller).
function isPlainTextNode(value: React.ReactNode): boolean {
  if (typeof value === "string" || typeof value === "number") return true;
  if (Array.isArray(value)) return value.every(isPlainTextNode);
  return false;
}

function renderCellContent(children: React.ReactNode) {
  return isPlainTextNode(children) ? <Text>{children}</Text> : children;
}

function Row({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={{ ...styles.row, ...style }}>{children}</View>;
}

function LabelCell({
  children,
  width,
  flex,
}: {
  children: React.ReactNode;
  width?: number;
  flex?: number;
}) {
  return <View style={{ ...styles.labelCell, width, flex }}>{renderCellContent(children)}</View>;
}

function ValueCell({
  children,
  width,
  flex,
  last,
  center,
}: {
  children: React.ReactNode;
  width?: number;
  flex?: number;
  last?: boolean;
  center?: boolean;
}) {
  const base = last ? styles.valueCellLast : styles.valueCell;
  const content = renderCellContent(children);
  return (
    <View style={{ ...base, width, flex }}>
      {center ? <View style={{ alignItems: "center" }}>{content}</View> : content}
    </View>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

type ReportWithRelations = Report & {
  techStackItems: TechStackItem[];
  workAllocations: WorkAllocation[];
  user: Pick<User, "name">;
};

export function ReportPdfDocument({ report }: { report: ReportWithRelations }) {
  const submittedAt = new Date(report.submittedAt).toLocaleDateString("ja-JP");

  const periodStart =
    report.projectPeriodStartYear && report.projectPeriodStartMonth
      ? `${report.projectPeriodStartYear}年${report.projectPeriodStartMonth}月`
      : "-";
  const periodEnd = report.projectPeriodOngoing
    ? "現在"
    : report.projectPeriodEndYear && report.projectPeriodEndMonth
      ? `${report.projectPeriodEndYear}年${report.projectPeriodEndMonth}月`
      : "-";

  const allocationItems = foldToPaletteSlots(
    report.workAllocations
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((w) => ({ category: w.category, percentage: w.percentage })),
  );
  const pieSlices = buildPieSlices(allocationItems, CATEGORICAL_PALETTE, 45, 45, 40);

  const devColTotalWidth = DEV_COL_WIDTH * DEV_PROCESS_OPTIONS.length;

  return (
    <Document title={`月次報告書_${report.targetYear}${String(report.targetMonth).padStart(2, "0")}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleRow}>
          <View style={styles.titleSpacer} />
          <Text style={styles.title}>月次報告書</Text>
          <Text style={styles.submittedAt}>提出日：　{submittedAt}</Text>
        </View>

        {/* 提出者情報 */}
        <View style={styles.table}>
          <Row>
            <LabelCell width={55}>提出者</LabelCell>
            <ValueCell width={135} center>
              {report.user.name}
            </ValueCell>
            <LabelCell width={45}>性別</LabelCell>
            <LabelCell width={45}>年齢</LabelCell>
            <LabelCell width={45}>対象月</LabelCell>
            <ValueCell flex={1} last center>
              {report.targetYear}年{report.targetMonth}月
            </ValueCell>
          </Row>
          <Row style={{ borderBottom: "none" }}>
            <LabelCell width={55}> </LabelCell>
            <ValueCell width={135}> </ValueCell>
            <ValueCell width={45} center>
              {report.gender ?? "-"}
            </ValueCell>
            <ValueCell width={45} center>
              {report.age !== null ? String(report.age) : "-"}
            </ValueCell>
            <LabelCell width={45}>経験年数</LabelCell>
            <ValueCell flex={1} last center>
              {report.experienceYears !== null ? `${report.experienceYears}年` : "-"}
            </ValueCell>
          </Row>
        </View>

        {/* 参画先・勤務 */}
        <View style={styles.table}>
          <Row>
            <LabelCell width={95}>参画先企業</LabelCell>
            <ValueCell flex={1} last>
              {report.clientCompany}
            </ValueCell>
          </Row>
          <Row>
            <LabelCell width={95}>作業場所</LabelCell>
            <ValueCell flex={1} last>
              {report.workLocation}
            </ValueCell>
          </Row>
          <Row style={{ borderBottom: "none" }}>
            <LabelCell width={95}>月間実労働</LabelCell>
            <LabelCell width={42}>日数</LabelCell>
            <ValueCell width={55}>{report.workDays ?? "-"}日</ValueCell>
            <LabelCell width={42}>時間</LabelCell>
            <ValueCell width={65}>{report.workHours ?? "-"}時間</ValueCell>
            <LabelCell width={55}>テレワーク</LabelCell>
            <ValueCell width={45}>{report.teleworkDays ?? "-"}日</ValueCell>
            <LabelCell width={40}>現場</LabelCell>
            <ValueCell flex={1} last>
              {report.onsiteDays ?? "-"}日
            </ValueCell>
          </Row>
        </View>

        {/* 技術スタック */}
        <View style={styles.table}>
          <Row>
            <ValueCell flex={1} last>
              <Text style={{ ...styles.sectionHeading, backgroundColor: LABEL_BG, padding: 2 }}>名称</Text>
            </ValueCell>
          </Row>
          {TECH_CATEGORY_OPTIONS.map(({ value, label }, categoryIndex, categories) => {
            const items = report.techStackItems
              .filter((t) => t.category === value)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((t) => t.name);
            const rows = chunk(items.length > 0 ? items : ["-"], 4);
            const isLastCategory = categoryIndex === categories.length - 1;

            return (
              <View
                key={value}
                style={{
                  flexDirection: "row",
                  borderBottom: isLastCategory ? "none" : BORDER,
                }}
              >
                <View style={{ ...styles.labelCell, width: 100 }}>
                  <Text>{label}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {rows.map((rowItems, rowIndex) => (
                    <View
                      key={rowIndex}
                      style={{
                        flexDirection: "row",
                        borderBottom: rowIndex === rows.length - 1 ? "none" : BORDER,
                        minHeight: 16,
                      }}
                    >
                      {Array.from({ length: 4 }, (_, i) => rowItems[i] ?? "").map((name, i) => (
                        <View
                          key={i}
                          style={{
                            flex: 1,
                            borderRight: i === 3 ? "none" : BORDER,
                            padding: 3,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {name && <Text style={{ textAlign: "center" }}>{name}</Text>}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* プロジェクト */}
        <View style={styles.table}>
          <Row>
            <LabelCell width={PERIOD_LABEL_WIDTH + PERIOD_VALUE_WIDTH}>期間</LabelCell>
            <LabelCell flex={1}>プロジェクト名／作業内容</LabelCell>
            <LabelCell width={devColTotalWidth}>開発工程</LabelCell>
          </Row>
          <Row style={{ borderBottom: "none" }}>
            <View
              style={{
                width: PERIOD_LABEL_WIDTH + PERIOD_VALUE_WIDTH,
                borderRight: BORDER,
                paddingVertical: 8,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={styles.centerText}>{periodStart}</Text>
              <Text style={styles.centerText}>〜</Text>
              <Text style={styles.centerText}>{periodEnd}</Text>
              {report.projectPeriodMonths !== null && (
                <Text style={{ ...styles.centerText, fontSize: 7.5, color: "#555" }}>
                  {report.projectPeriodMonths}ヶ月
                </Text>
              )}
            </View>

            <View style={{ flex: 1, borderRight: BORDER, padding: 5 }}>
              <Text style={{ fontWeight: "bold", fontSize: 8.5, marginBottom: 4, textAlign: "center" }}>
                {report.projectName}
              </Text>
              <Text style={styles.bodyText}>{report.workContent}</Text>
            </View>

            <View style={{ width: devColTotalWidth, flexDirection: "row" }}>
              {DEV_PROCESS_OPTIONS.map((option, i, arr) => {
                const active = report.devProcesses.includes(option);
                const chars = DEV_PROCESS_PDF_LABELS[option].split("");
                return (
                  <View
                    key={option}
                    style={{
                      width: DEV_COL_WIDTH,
                      borderRight: i === arr.length - 1 ? "none" : BORDER,
                    }}
                  >
                    <View style={{ alignItems: "center", paddingTop: 3 }}>
                      {chars.map((ch, ci) => (
                        <Text key={ci} style={{ fontSize: 6.5, fontWeight: "bold", lineHeight: 1.3 }}>
                          {ch}
                        </Text>
                      ))}
                    </View>
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      {active && <Text style={{ fontSize: 9, color: "#0b5c1f" }}>○</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </Row>
        </View>

        {/* 成果物・所感 */}
        {report.deliverables && (
          <View style={styles.table}>
            <Row style={{ borderBottom: "none" }}>
              <LabelCell width={90}>成果物</LabelCell>
              <ValueCell flex={1} last>
                <Text style={styles.bodyText}>{report.deliverables}</Text>
              </ValueCell>
            </Row>
          </View>
        )}

        {report.troubles && (
          <View style={styles.table}>
            <Row style={{ borderBottom: "none" }}>
              <LabelCell width={90}>
                今月の{"\n"}困った点と{"\n"}対応・解決方法
              </LabelCell>
              <ValueCell flex={1} last>
                <Text style={styles.bodyText}>{report.troubles}</Text>
              </ValueCell>
            </Row>
          </View>
        )}

        {report.goodPoints && (
          <View style={styles.table}>
            <Row style={{ borderBottom: "none" }}>
              <LabelCell width={90}>
                今月の{"\n"}良かった点/{"\n"}改善提案など
              </LabelCell>
              <ValueCell flex={1} last>
                <Text style={styles.bodyText}>{report.goodPoints}</Text>
              </ValueCell>
            </Row>
          </View>
        )}

        {/* 自己評価 + 作業配分 */}
        <View style={{ ...styles.table, flexDirection: "row" }}>
          <View style={{ width: PROJECT_LABEL_WIDTH + 130, borderRight: BORDER }}>
            {RATING_FIELDS.map(({ key, label }, i, arr) => (
              <View
                key={key}
                style={{
                  flexDirection: "row",
                  borderBottom: i === arr.length - 1 ? "none" : BORDER,
                }}
              >
                <View style={{ ...styles.labelCell, width: PROJECT_LABEL_WIDTH, borderRight: BORDER }}>
                  <Text>{label}</Text>
                </View>
                <View style={{ padding: 4, flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text>{ratingLabel(report[key])}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ ...styles.labelCell, width: 44, borderRight: BORDER }}>
            <Text style={{ textAlign: "center" }}>作業配分</Text>
          </View>

          <View style={{ flex: 1, padding: 10, alignItems: "center", justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Svg width={95} height={95} viewBox="0 0 90 90">
                {pieSlices.map((slice) => (
                  <SvgPath key={slice.category} d={slice.path} fill={slice.color} />
                ))}
              </Svg>
              <View style={{ gap: 4 }}>
                {pieSlices.map((slice) => (
                  <View key={slice.category} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View style={{ width: 7, height: 7, backgroundColor: slice.color }} />
                    <Text style={{ fontSize: 7.5 }}>
                      {slice.category} {slice.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <Text style={{ position: "absolute", bottom: 14, left: 24, fontSize: 7, color: "#999999" }}>
          作成日時: {new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
        </Text>
      </Page>
    </Document>
  );
}
