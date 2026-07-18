import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/requireAdmin";
import { generateInitialPassword, hashPassword } from "@/lib/password";
import { notifyPasswordReset } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const data: {
    name?: string;
    role?: "ADMIN" | "USER";
    email?: string | null;
    isActive?: boolean;
    passwordHash?: string;
    failedLoginCount?: number;
  } = {};

  if (typeof body.name === "string" && body.name.trim() !== "") data.name = body.name.trim();
  if (body.role === "ADMIN" || body.role === "USER") data.role = body.role;
  if (typeof body.email === "string") data.email = body.email.trim() === "" ? null : body.email.trim();
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  let newPassword: string | null = null;
  let plainPasswordForEmail: string | null = null;
  if (typeof body.password === "string" && body.password.trim() !== "") {
    const password = body.password.trim();
    if (password.length < 8) {
      return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 });
    }
    data.passwordHash = await hashPassword(password);
    data.failedLoginCount = 0;
    plainPasswordForEmail = password;
  } else if (body.resetPassword === true) {
    newPassword = generateInitialPassword();
    data.passwordHash = await hashPassword(newPassword);
    data.failedLoginCount = 0;
    plainPasswordForEmail = newPassword;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, loginId: true, name: true, role: true, email: true, isActive: true },
  });

  if (plainPasswordForEmail) {
    await notifyPasswordReset(user, plainPasswordForEmail);
  }

  return NextResponse.json({ user, newPassword });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "自分自身のアカウントは削除できません" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  if (target.role !== "USER") {
    return NextResponse.json({ error: "管理者アカウントは削除できません" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.report.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
