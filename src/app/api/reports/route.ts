import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/requireUser";
import { buildReportInputSchema } from "@/lib/reportSchema";
import { toReportCreateData } from "@/lib/reportData";
import { isUniqueConstraintError } from "@/lib/prismaErrors";

export async function GET() {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const reports = await prisma.report.findMany({
    where: { userId: session.user.id },
    orderBy: [{ targetYear: "desc" }, { targetMonth: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(reports);
}

export async function POST(request: NextRequest) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

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
    const report = await prisma.report.create({
      data: toReportCreateData(data, session.user.id),
    });
    return NextResponse.json(report, { status: 201 });
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "対象月の報告書は既に作成されています。編集画面から更新してください。" },
        { status: 409 },
      );
    }
    throw error;
  }
}
