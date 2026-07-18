import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/requireUser";
import { ReportPdfDocument } from "@/lib/pdf/ReportPdfDocument";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: { techStackItems: true, workAllocations: true, user: { select: { name: true } } },
  });

  if (!report) return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });
  if (report.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const buffer = await renderToBuffer(ReportPdfDocument({ report }));
  const fileName = `月次報告書_${report.targetYear}${String(report.targetMonth).padStart(2, "0")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}
