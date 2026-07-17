import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/requireAdmin";
import { generateInitialPassword, hashPassword } from "@/lib/password";

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
  if (body.resetPassword === true) {
    newPassword = generateInitialPassword();
    data.passwordHash = await hashPassword(newPassword);
    data.failedLoginCount = 0;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, loginId: true, name: true, role: true, email: true, isActive: true },
  });

  return NextResponse.json({ user, newPassword });
}
