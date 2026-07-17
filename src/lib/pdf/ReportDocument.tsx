import path from "node:path";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Report } from "@prisma/client";

Font.register({
  family: "NotoSansJP",
  fonts: [
    { src: path.join(process.cwd(), "src/fonts/NotoSansJP-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "src/fonts/NotoSansJP-Bold.ttf"), fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 10.5,
    padding: 48,
    color: "#1a1a1a",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#555555",
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottom: "1px solid #dddddd",
    paddingBottom: 12,
  },
  metaItem: {
    marginRight: 32,
  },
  metaLabel: {
    fontSize: 8.5,
    color: "#777777",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    backgroundColor: "#f0f0f0",
    padding: 6,
  },
  sectionBody: {
    fontSize: 10.5,
    lineHeight: 1.6,
    padding: "0 6px",
    whiteSpace: "pre-wrap",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#999999",
    textAlign: "center",
  },
});

function Section({ heading, body }: { heading: string; body: string | null }) {
  if (!body) return null;
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

export function ReportDocument({ report }: { report: Report }) {
  const generatedAt = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  return (
    <Document title={report.title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.subtitle}>
          {report.year}年{report.month}月分 月次報告書
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>対象年月</Text>
            <Text style={styles.metaValue}>
              {report.year}年{report.month}月
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>作成者</Text>
            <Text style={styles.metaValue}>{report.author}</Text>
          </View>
          {report.department && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>部署</Text>
              <Text style={styles.metaValue}>{report.department}</Text>
            </View>
          )}
        </View>

        <Section heading="概要" body={report.summary} />
        <Section heading="今月の実績" body={report.achievements} />
        <Section heading="課題・問題点" body={report.issues} />
        <Section heading="来月の予定" body={report.nextPlan} />
        <Section heading="その他・備考" body={report.notes} />

        <Text style={styles.footer}>作成日時: {generatedAt}</Text>
      </Page>
    </Document>
  );
}
