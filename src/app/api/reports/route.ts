import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/requireUser";
import { reportInputSchema } from "@/lib/reportSchema";
import { toReportCreateData } from "@/lib/reportData";

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

  const body = await request.json();
  const parsed = reportInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力内容に誤りがあります", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const report = await prisma.report.create({
      data: toReportCreateData(parsed.data, session.user.id),
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

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
