import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { ReportPdfDocument } from "@/lib/pdf/ReportPdfDocument";

export async function loadReportForPdf(reportId: string) {
  return prisma.report.findUnique({
    where: { id: reportId },
    include: { techStackItems: true, workAllocations: true, user: { select: { name: true, workType: true } } },
  });
}

export type ReportForPdf = NonNullable<Awaited<ReturnType<typeof loadReportForPdf>>>;

export function reportPdfFileName(report: Pick<ReportForPdf, "targetYear" | "targetMonth"> & { user: Pick<ReportForPdf["user"], "name"> }) {
  return `${report.targetYear}${String(report.targetMonth).padStart(2, "0")}度月次報告書_${report.user.name}.pdf`;
}

export async function renderReportPdfBuffer(report: ReportForPdf): Promise<Buffer> {
  return renderToBuffer(ReportPdfDocument({ report }));
}
