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
// Disable English-style mid-word hyphenation for any Latin text in the document
// (tech stack names, etc). Note this does NOT prevent react-pdf's line-breaker
// from inserting a "-" when a line must wrap exactly at a kanji/katakana script
// boundary — that's handled below by keeping short Japanese labels on one line
// (wide-enough columns / shortened labels) so no such wrap is ever needed.
Font.registerHyphenationCallback((word) => [word]);

const BORDER = "0.75pt solid #999999";
const LABEL_BG = "#e3efe6";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 8.5,
    padding: 28,
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
    fontSize: 16,
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
  sectionHeading: {
    fontWeight: "bold",
    fontSize: 9,
  },
  bodyText: {
    fontSize: 8.5,
    lineHeight: 1.5,
  },
  techRow: {
    flexDirection: "row",
    borderBottom: BORDER,
    minHeight: 16,
  },
  devProcessCell: {
    flex: 1,
    borderRight: BORDER,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    gap: 2,
  },
  devProcessCellLast: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    gap: 2,
  },
});

// Shortened, kanji-only labels for the narrow dev-process cells. Avoids labels
// like "単体テスト" that mix kanji and katakana — react-pdf's line-breaker
// inserts a stray "-" whenever a wrap is forced exactly at that script boundary.
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

function LabelCell({ children, width }: { children: React.ReactNode; width?: number }) {
  return <View style={{ ...styles.labelCell, width }}>{renderCellContent(children)}</View>;
}

function ValueCell({
  children,
  width,
  flex,
  last,
}: {
  children: React.ReactNode;
  width?: number;
  flex?: number;
  last?: boolean;
}) {
  const base = last ? styles.valueCellLast : styles.valueCell;
  return <View style={{ ...base, width, flex }}>{renderCellContent(children)}</View>;
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

  return (
    <Document title={`月次報告書_${report.targetYear}${String(report.targetMonth).padStart(2, "0")}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleRow}>
          <View style={styles.titleSpacer} />
          <Text style={styles.title}>月次報告書</Text>
          <Text style={styles.submittedAt}>提出日: {submittedAt}</Text>
        </View>

        {/* 提出者情報 */}
        <View style={styles.table}>
          <Row>
            <LabelCell width={60}>提出者</LabelCell>
            <ValueCell width={140}>{report.user.name}</ValueCell>
            <LabelCell width={45}>性別</LabelCell>
            <ValueCell width={70}>{report.gender ?? "-"}</ValueCell>
            <LabelCell width={45}>年齢</LabelCell>
            <ValueCell flex={1} last>
              {report.age !== null ? String(report.age) : "-"}
            </ValueCell>
          </Row>
          <Row style={{ borderBottom: "none" }}>
            <LabelCell width={60}> </LabelCell>
            <ValueCell width={140}> </ValueCell>
            <LabelCell width={45}>対象月</LabelCell>
            <ValueCell width={70}>
              {report.targetYear}年{report.targetMonth}月
            </ValueCell>
            <LabelCell width={45}>経験年数</LabelCell>
            <ValueCell flex={1} last>
              {report.experienceYears !== null ? `${report.experienceYears}年` : "-"}
            </ValueCell>
          </Row>
        </View>

        {/* 参画先・勤務 */}
        <View style={styles.table}>
          <Row>
            <LabelCell width={90}>参画先企業</LabelCell>
            <ValueCell flex={1} last>
              {report.clientCompany}
            </ValueCell>
          </Row>
          <Row>
            <LabelCell width={90}>作業場所</LabelCell>
            <ValueCell flex={1} last>
              {report.workLocation}
            </ValueCell>
          </Row>
          <Row style={{ borderBottom: "none" }}>
            <LabelCell width={90}>月間実労働</LabelCell>
            <ValueCell width={110}>日数 {report.workDays ?? "-"}日</ValueCell>
            <ValueCell width={110}>時間 {report.workHours ?? "-"}時間</ValueCell>
            <ValueCell width={110}>テレワーク {report.teleworkDays ?? "-"}日</ValueCell>
            <ValueCell flex={1} last>
              現場 {report.onsiteDays ?? "-"}日
            </ValueCell>
          </Row>
        </View>

        {/* 技術スタック */}
        <View style={styles.table}>
          <Row>
            <ValueCell flex={1} last>
              <Text style={styles.sectionHeading}>名称</Text>
            </ValueCell>
          </Row>
          {TECH_CATEGORY_OPTIONS.map(({ value, label }, i, arr) => {
            const names = report.techStackItems
              .filter((t) => t.category === value)
              .map((t) => t.name)
              .join(" / ");
            return (
              <Row key={value} style={i === arr.length - 1 ? { borderBottom: "none" } : undefined}>
                <LabelCell width={108}>{label}</LabelCell>
                <ValueCell flex={1} last>
                  {names || "-"}
                </ValueCell>
              </Row>
            );
          })}
        </View>

        {/* プロジェクト */}
        <View style={styles.table}>
          <Row style={{ borderBottom: "none" }}>
            <LabelCell width={70}>期間</LabelCell>
            <ValueCell width={150}>
              <Text>
                {periodStart} 〜 {periodEnd}
              </Text>
              {report.projectPeriodMonths !== null && (
                <Text style={{ fontSize: 7.5, color: "#555" }}>{report.projectPeriodMonths}ヶ月</Text>
              )}
            </ValueCell>
            <View style={{ flex: 1, borderRight: BORDER }}>
              <View style={{ padding: 4, borderBottom: BORDER }}>
                <Text style={{ fontWeight: "bold", fontSize: 8.5, marginBottom: 2 }}>{report.projectName}</Text>
                <Text style={styles.bodyText}>{report.workContent}</Text>
              </View>
              <View style={{ padding: 4 }}>
                <Text style={{ fontSize: 7.5, fontWeight: "bold", marginBottom: 3 }}>開発工程</Text>
                <View style={{ flexDirection: "row" }}>
                  {DEV_PROCESS_OPTIONS.map((option, i, arr) => {
                    const active = report.devProcesses.includes(option);
                    return (
                      <View
                        key={option}
                        style={
                          i === arr.length - 1
                            ? styles.devProcessCellLast
                            : styles.devProcessCell
                        }
                      >
                        <Text
                          style={{
                            fontSize: 6.5,
                            textAlign: "center",
                            fontWeight: active ? "bold" : "normal",
                            color: active ? "#0b5c1f" : "#999999",
                          }}
                        >
                          {DEV_PROCESS_PDF_LABELS[option]}
                        </Text>
                        <Text style={{ fontSize: 8, color: active ? "#0b5c1f" : "transparent" }}>○</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </Row>
        </View>

        {/* 成果物・所感 */}
        {report.deliverables && (
          <View style={styles.table}>
            <Row style={{ borderBottom: "none" }}>
              <LabelCell width={80}>成果物</LabelCell>
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
          <View style={{ width: 260, borderRight: BORDER }}>
            {RATING_FIELDS.map(({ key, label }, i, arr) => (
              <View
                key={key}
                style={{
                  flexDirection: "row",
                  borderBottom: i === arr.length - 1 ? "none" : BORDER,
                }}
              >
                <View style={{ ...styles.labelCell, width: 150, borderRight: BORDER }}>
                  <Text>{label}</Text>
                </View>
                <View style={{ padding: 4, flex: 1, justifyContent: "center" }}>
                  <Text>{ratingLabel(report[key])}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ flex: 1, padding: 8, alignItems: "center" }}>
            <Text style={{ fontSize: 8, fontWeight: "bold", marginBottom: 4 }}>作業配分</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Svg width={90} height={90} viewBox="0 0 90 90">
                {pieSlices.map((slice) => (
                  <SvgPath key={slice.category} d={slice.path} fill={slice.color} />
                ))}
              </Svg>
              <View style={{ gap: 3 }}>
                {pieSlices.map((slice) => (
                  <View key={slice.category} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View style={{ width: 6, height: 6, backgroundColor: slice.color }} />
                    <Text style={{ fontSize: 7 }}>
                      {slice.category} {slice.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <Text style={{ position: "absolute", bottom: 16, left: 28, fontSize: 7, color: "#999999" }}>
          作成日時: {new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
        </Text>
      </Page>
    </Document>
  );
}
