import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/requireAdmin";

// 未読をまとめて既読にする
export async function PATCH() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const result = await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });
  return NextResponse.json({ updated: result.count });
}

// 既読の通知をまとめて削除する
export async function DELETE() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const result = await prisma.notification.deleteMany({ where: { isRead: true } });
  return NextResponse.json({ deleted: result.count });
}
