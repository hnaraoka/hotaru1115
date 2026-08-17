import { prisma } from "@/lib/prisma";
import { loadReportForPdf, renderReportPdfBuffer, reportPdfFileName } from "@/lib/reportPdf";
import { isLineWorksDriveConfigured, uploadPdfToLineWorksDrive } from "@/lib/lineworksDrive";

// 承認済み報告書のPDFをLINE WORKS Driveへ自動格納する。LINE WORKS連携の
// 環境変数が未設定の場合は何もしない（この機能を使わない環境に影響しないため）。
// 失敗しても承認自体は取り消さず、Reportにエラー内容を記録し管理者向け通知を
// 残すだけに留める（管理画面から手動で再試行できる）。
export async function attemptLineWorksDriveUpload(reportId: string): Promise<void> {
  if (!isLineWorksDriveConfigured()) return;

  const report = await loadReportForPdf(reportId);
  if (!report) return;

  try {
    const buffer = await renderReportPdfBuffer(report);
    const fileName = reportPdfFileName(report);
    const { fileId, fileUrl } = await uploadPdfToLineWorksDrive(fileName, buffer);

    await prisma.report.update({
      where: { id: reportId },
      data: { driveFileId: fileId, driveFileUrl: fileUrl, driveUploadedAt: new Date(), driveUploadError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    console.error(`LINE WORKS Driveへのアップロードに失敗しました (report: ${reportId})`, error);

    await prisma.report.update({
      where: { id: reportId },
      data: { driveUploadError: message },
    });

    await prisma.notification.create({
      data: {
        message: `${report.user.name}さんの${report.targetYear}年${report.targetMonth}月分報告書のLINE WORKS Driveへの自動格納に失敗しました。報告書詳細画面から再試行してください。`,
        relatedUserId: report.userId,
      },
    });
  }
}
