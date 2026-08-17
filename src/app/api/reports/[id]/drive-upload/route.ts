import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { attemptLineWorksDriveUpload } from "@/lib/driveUpload";
import { isLineWorksDriveConfigured } from "@/lib/lineworksDrive";

type Params = { params: Promise<{ id: string }> };

// 承認済み報告書のLINE WORKS Driveへの自動格納を管理者が手動で再試行するためのAPI。
export async function POST(_request: NextRequest, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id }, select: { id: true, reviewStatus: true } });
  if (!report) return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });
  if (report.reviewStatus !== "APPROVED") {
    return NextResponse.json({ error: "承認済みの報告書のみLINE WORKS Driveへ送信できます" }, { status: 400 });
  }
  if (!isLineWorksDriveConfigured()) {
    return NextResponse.json({ error: "LINE WORKS連携が設定されていません（環境変数を確認してください）" }, { status: 400 });
  }

  await attemptLineWorksDriveUpload(id);
  const updated = await prisma.report.findUnique({ where: { id } });
  return NextResponse.json(updated);
}
