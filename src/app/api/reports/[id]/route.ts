import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/requireUser";
import { reportInputSchema } from "@/lib/reportSchema";
import { toReportUpdateData } from "@/lib/reportData";

type Params = { params: Promise<{ id: string }> };

async function loadOwnedReport(id: string, userId: string, isAdmin: boolean) {
  const report = await prisma.report.findUnique({
    where: { id },
    include: { techStackItems: true, workAllocations: true },
  });
  if (!report) return null;
  if (report.userId !== userId && !isAdmin) return "forbidden" as const;
  return report;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const { id } = await params;
  const result = await loadOwnedReport(id, session.user.id, session.user.role === "ADMIN");
  if (result === null) return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });
  if (result === "forbidden") return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedReport(id, session.user.id, session.user.role === "ADMIN");
  if (existing === null) return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });
  if (existing === "forbidden") return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const body = await request.json();
  const parsed = reportInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力内容に誤りがあります", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const report = await prisma.report.update({
      where: { id },
      data: toReportUpdateData(parsed.data),
    });
    return NextResponse.json(report);
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "対象月の報告書は既に作成されています。" },
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
  const existing = await loadOwnedReport(id, session.user.id, session.user.role === "ADMIN");
  if (existing === null) return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });
  if (existing === "forbidden") return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  await prisma.report.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
