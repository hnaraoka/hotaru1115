import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/requireAdmin";

// 対象年の月次報告書を一括削除する。ストレージ逼迫時に、CSV出力で退避した
// 古いデータを削除する運用のためのエンドポイント。TechStackItem/WorkAllocation
// はスキーマ上 onDelete: Cascade のため、Reportの削除だけで一緒に消える。
export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const year = Number(body?.year);
  if (!Number.isInteger(year)) {
    return NextResponse.json({ error: "対象年を指定してください" }, { status: 400 });
  }

  const count = await prisma.report.count({ where: { targetYear: year } });
  if (count === 0) {
    return NextResponse.json({ error: `${year}年分の月次報告書はありません` }, { status: 404 });
  }

  const result = await prisma.report.deleteMany({ where: { targetYear: year } });

  return NextResponse.json({ success: true, deletedCount: result.count });
}
