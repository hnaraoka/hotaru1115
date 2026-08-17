import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/requireUser";
import { loadReportForPdf, renderReportPdfBuffer, reportPdfFileName } from "@/lib/reportPdf";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const { id } = await params;
  const report = await loadReportForPdf(id);

  if (!report) return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });
  if (report.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  let buffer: Buffer;
  try {
    buffer = await renderReportPdfBuffer(report);
  } catch (error) {
    console.error("PDF生成に失敗しました", error);
    return NextResponse.json({ error: "PDFの生成に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }

  const fileName = reportPdfFileName(report);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
      // Without this, browsers may serve a cached copy of a previous
      // generation from before the report was last edited, since the URL
      // (/api/reports/[id]/pdf) never changes.
      "Cache-Control": "no-store",
    },
  });
}
