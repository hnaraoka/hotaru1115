import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/requireAdmin";
import { generateInitialPassword, hashPassword } from "@/lib/password";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      loginId: true,
      name: true,
      role: true,
      email: true,
      isActive: true,
      failedLoginCount: true,
      createdAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const body = await request.json();
  const loginId = typeof body.loginId === "string" ? body.loginId.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role = body.role === "ADMIN" ? "ADMIN" : "USER";
  const email = typeof body.email === "string" && body.email.trim() !== "" ? body.email.trim() : null;

  if (!loginId || !name) {
    return NextResponse.json({ error: "ログインIDと氏名は必須です" }, { status: 400 });
  }

  let birthDate: Date | null = null;
  if (typeof body.birthDate === "string" && body.birthDate.trim() !== "") {
    const parsed = new Date(body.birthDate);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "生年月日の指定が正しくありません" }, { status: 400 });
    }
    birthDate = parsed;
  }

  const existing = await prisma.user.findUnique({ where: { loginId } });
  if (existing) {
    return NextResponse.json({ error: "このログインIDは既に使用されています" }, { status: 400 });
  }

  const initialPassword = generateInitialPassword();
  const passwordHash = await hashPassword(initialPassword);

  const user = await prisma.user.create({
    data: { loginId, name, role, email, birthDate, passwordHash },
    select: { id: true, loginId: true, name: true, role: true, email: true },
  });

  return NextResponse.json({ user, initialPassword }, { status: 201 });
}
