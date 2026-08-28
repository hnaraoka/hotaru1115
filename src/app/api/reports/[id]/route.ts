import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/requireUser";
import { buildReportInputSchema } from "@/lib/reportSchema";
import { toReportUpdateData } from "@/lib/reportData";
import { isUniqueConstraintError } from "@/lib/prismaErrors";

type Params = { params: Promise<{ id: string }> };

// 報告書の閲覧・編集・削除は本人のみに限定する。管理者による他ユーザーの
// 報告書閲覧は /reports/[id] ページ（別途admin判定あり、提出状況ダッシュ
// ボードからの遷移で使用）で完結しており、このAPIには依存していない。
async function loadOwnedReport(id: string, userId: string) {
  const report = await prisma.report.findUnique({
    where: { id },
    include: { techStackItems: true, workAllocations: true },
  });
  if (!report) return null;
  if (report.userId !== userId) return "forbidden" as const;
  return report;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const { id } = await params;
  const result = await loadOwnedReport(id, session.user.id);
  if (result === null) return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });
  if (result === "forbidden") return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedReport(id, session.user.id);
  if (existing === null) return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });
  if (existing === "forbidden") return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const actingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workType: true, gender: true },
  });

  const body = await request.json();
  const parsed = buildReportInputSchema(actingUser?.workType !== "OFFICE").safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力内容に誤りがあります", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // 性別は画面上は編集不可（ユーザー情報からの自動反映）だが、APIを直接
  // 叩けば任意の値を送れてしまうため、クライアントの値は使わずサーバー側で
  // ユーザー情報から取得した値に必ず上書きする。
  const data = { ...parsed.data, gender: actingUser?.gender ?? null };

  try {
    const report = await prisma.report.update({
      where: { id },
      data: {
        ...toReportUpdateData(data),
        // 内容が変わった以上、管理者に再確認してもらう必要があるため、
        // 本人による保存のたびにレビュー状況を未レビューへ戻す。
        reviewStatus: "PENDING",
        reviewComment: null,
        reviewedAt: null,
        reviewedByName: null,
      },
    });
    return NextResponse.json(report);
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      // 対象年月をそのユーザーの別の報告書と重複する値に変更しようとした場合。
      // どの報告書と衝突しているかが分からないと解決しづらいため、該当の
      // 報告書IDを併せて返し、画面側でリンクできるようにする。
      const conflicting = await prisma.report.findUnique({
        where: {
          userId_targetYear_targetMonth: {
            userId: session.user.id,
            targetYear: data.targetYear,
            targetMonth: data.targetMonth,
          },
        },
        select: { id: true },
      });
      return NextResponse.json(
        {
          error: `${data.targetYear}年${data.targetMonth}月の報告書は既に別に作成されています。`,
          conflictingReportId: conflicting?.id,
        },
        { status: 409 },
      );
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedReport(id, session.user.id);
  if (existing === null) return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });
  if (existing === "forbidden") return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  await prisma.report.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
