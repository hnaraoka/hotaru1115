import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/requireAdmin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_request: NextRequest, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { id } = await params;
  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
  return NextResponse.json(notification);
}
