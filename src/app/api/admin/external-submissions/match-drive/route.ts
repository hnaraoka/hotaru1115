import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";

// LINE WORKS Driveの対象フォルダ内ファイル名一覧（管理者が手動でコピー&ペーストしたもの）を
// アクティブユーザーの氏名と突き合わせ、一致したユーザーを外部提出確認済みとして自動登録する。
export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { targetYear, targetMonth, fileNames } = body;
  if (!Number.isInteger(targetYear) || !Number.isInteger(targetMonth) || !Array.isArray(fileNames)) {
    return NextResponse.json({ error: "入力内容に誤りがあります" }, { status: 400 });
  }

  const lines = fileNames
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

  const [users, reports, externalSubmissions] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true, role: "USER" }, select: { id: true, name: true } }),
    prisma.report.findMany({ where: { targetYear, targetMonth }, select: { userId: true } }),
    prisma.externalSubmission.findMany({ where: { targetYear, targetMonth }, select: { userId: true } }),
  ]);

  const alreadyCoveredUserIds = new Set([
    ...reports.map((r) => r.userId),
    ...externalSubmissions.map((e) => e.userId),
  ]);

  const confirmedByName = session.user.name ?? session.user.loginId;
  const matched: { userId: string; userName: string; fileName: string }[] = [];

  for (const user of users) {
    if (alreadyCoveredUserIds.has(user.id)) continue;
    const fileName = lines.find((line) => line.includes(user.name));
    if (!fileName) continue;
    matched.push({ userId: user.id, userName: user.name, fileName });
  }

  await Promise.all(
    matched.map((m) =>
      prisma.externalSubmission.upsert({
        where: { userId_targetYear_targetMonth: { userId: m.userId, targetYear, targetMonth } },
        create: {
          userId: m.userId,
          targetYear,
          targetMonth,
          confirmedByName,
          note: `LINE WORKS Driveのファイル名照合: ${m.fileName}`,
        },
        update: {
          confirmedByName,
          note: `LINE WORKS Driveのファイル名照合: ${m.fileName}`,
        },
      }),
    ),
  );

  return NextResponse.json({ matchedCount: matched.length, matched: matched.map((m) => m.userName) });
}
