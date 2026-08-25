import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/requireAdmin";
import { isNotFoundError } from "@/lib/prismaErrors";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_request: NextRequest, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { id } = await params;
  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return NextResponse.json(notification);
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "通知が見つかりません" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "通知が見つかりません" }, { status: 404 });
    }
    throw error;
  }
}
