import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { userId, targetYear, targetMonth, note } = body;
  if (typeof userId !== "string" || !Number.isInteger(targetYear) || !Number.isInteger(targetMonth)) {
    return NextResponse.json({ error: "入力内容に誤りがあります" }, { status: 400 });
  }

  const record = await prisma.externalSubmission.upsert({
    where: { userId_targetYear_targetMonth: { userId, targetYear, targetMonth } },
    create: {
      userId,
      targetYear,
      targetMonth,
      confirmedByName: session.user.name ?? session.user.loginId,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
    },
    update: {
      confirmedByName: session.user.name ?? session.user.loginId,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const targetYear = Number(searchParams.get("targetYear"));
  const targetMonth = Number(searchParams.get("targetMonth"));
  if (!userId || !Number.isInteger(targetYear) || !Number.isInteger(targetMonth)) {
    return NextResponse.json({ error: "入力内容に誤りがあります" }, { status: 400 });
  }

  await prisma.externalSubmission
    .delete({ where: { userId_targetYear_targetMonth: { userId, targetYear, targetMonth } } })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
