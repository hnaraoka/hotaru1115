import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/requireUser";
import { hashPassword } from "@/lib/password";

export async function PATCH(request: NextRequest) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const body = await request.json();
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword.trim() : "";

  if (!currentPassword) {
    return NextResponse.json({ error: "現在のパスワードを入力してください" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "新しいパスワードは8文字以上で入力してください" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "現在のパスワードが正しくありません" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), passwordChangedAt: new Date(), failedLoginCount: 0 },
  });

  return NextResponse.json({ success: true });
}
