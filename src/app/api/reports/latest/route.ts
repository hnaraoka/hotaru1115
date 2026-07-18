import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/requireUser";

export async function GET() {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const report = await prisma.report.findFirst({
    where: { userId: session.user.id },
    orderBy: [{ targetYear: "desc" }, { targetMonth: "desc" }, { createdAt: "desc" }],
    include: { techStackItems: true },
  });

  return NextResponse.json(report);
}
