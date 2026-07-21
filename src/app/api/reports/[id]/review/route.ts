import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { notifyRevisionRequested } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { reviewStatus, reviewComment } = body;

  if (reviewStatus !== "APPROVED" && reviewStatus !== "NEEDS_REVISION") {
    return NextResponse.json({ error: "レビュー状況の指定が正しくありません" }, { status: 400 });
  }
  if (reviewStatus === "NEEDS_REVISION" && !(typeof reviewComment === "string" && reviewComment.trim())) {
    return NextResponse.json({ error: "差し戻す場合は指摘内容を入力してください" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({
    where: { id },
    include: { user: { select: { loginId: true, name: true, email: true } } },
  });
  if (!report) return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });

  const updated = await prisma.report.update({
    where: { id },
    data: {
      reviewStatus,
      reviewComment: typeof reviewComment === "string" && reviewComment.trim() ? reviewComment.trim() : null,
      reviewedAt: new Date(),
      reviewedByName: session.user.name ?? session.user.loginId,
    },
  });

  if (reviewStatus === "NEEDS_REVISION") {
    await notifyRevisionRequested(report.user, report.targetYear, report.targetMonth, updated.reviewComment ?? "");
  }

  return NextResponse.json(updated);
}
