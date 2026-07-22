import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/requireUser";

export async function PATCH(request: NextRequest) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const year = Number(body.engineerStartYear);
  const month = Number(body.engineerStartMonth);

  if (!Number.isInteger(year) || year < 1950 || year > 2100) {
    return NextResponse.json({ error: "開始年の指定が正しくありません" }, { status: 400 });
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "開始月の指定が正しくありません" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { engineerStartYear: year, engineerStartMonth: month },
  });

  return NextResponse.json({ ok: true });
}
