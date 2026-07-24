import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/requireAdmin";
import { generateInitialPassword, hashPassword } from "@/lib/password";

type InputRow = {
  loginId: string;
  name: string;
  role: "ADMIN" | "USER";
  email: string | null;
  birthDate: string | null;
  workType: "ENGINEER" | "OFFICE";
};

type ResultRow = {
  loginId: string;
  name: string;
  role: "ADMIN" | "USER";
  email: string | null;
  birthDate: string | null;
  workType: "ENGINEER" | "OFFICE";
  success: boolean;
  initialPassword?: string;
  error?: string;
};

function parseWorkType(value: unknown): "ENGINEER" | "OFFICE" {
  return value === "OFFICE" ? "OFFICE" : "ENGINEER";
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const body = await request.json();
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json({ error: "登録するユーザーがありません" }, { status: 400 });
  }
  if (rows.length > 200) {
    return NextResponse.json({ error: "一度に登録できるのは200件までです" }, { status: 400 });
  }

  const seenLoginIds = new Set<string>();
  const results: ResultRow[] = [];

  for (const raw of rows as unknown[]) {
    const r = raw as Record<string, unknown>;
    const loginId = typeof r.loginId === "string" ? r.loginId.trim() : "";
    const name = typeof r.name === "string" ? r.name.trim() : "";
    const role: "ADMIN" | "USER" = r.role === "ADMIN" ? "ADMIN" : "USER";
    const email = typeof r.email === "string" && r.email.trim() !== "" ? r.email.trim() : null;
    const birthDateInput = typeof r.birthDate === "string" ? r.birthDate.trim() : "";
    const workType = parseWorkType(r.workType);

    if (!loginId || !name) {
      results.push({
        loginId,
        name,
        role,
        email,
        birthDate: birthDateInput || null,
        workType,
        success: false,
        error: "ログインIDと氏名は必須です",
      });
      continue;
    }
    if (seenLoginIds.has(loginId)) {
      results.push({
        loginId,
        name,
        role,
        email,
        birthDate: birthDateInput || null,
        workType,
        success: false,
        error: "CSV内でログインIDが重複しています",
      });
      continue;
    }
    seenLoginIds.add(loginId);

    if (birthDateInput === "") {
      results.push({
        loginId,
        name,
        role,
        email,
        birthDate: null,
        workType,
        success: false,
        error: "生年月日は必須です",
      });
      continue;
    }
    const birthDate = new Date(birthDateInput);
    if (Number.isNaN(birthDate.getTime())) {
      results.push({
        loginId,
        name,
        role,
        email,
        birthDate: birthDateInput,
        workType,
        success: false,
        error: "生年月日の指定が正しくありません",
      });
      continue;
    }

    const existing = await prisma.user.findUnique({ where: { loginId } });
    if (existing) {
      results.push({
        loginId,
        name,
        role,
        email,
        birthDate: birthDateInput,
        workType,
        success: false,
        error: "このログインIDは既に使用されています",
      });
      continue;
    }

    const initialPassword = generateInitialPassword();
    try {
      await prisma.user.create({
        data: { loginId, name, role, email, birthDate, workType, passwordHash: await hashPassword(initialPassword) },
      });
      results.push({
        loginId,
        name,
        role,
        email,
        birthDate: birthDateInput,
        workType,
        success: true,
        initialPassword,
      });
    } catch {
      results.push({
        loginId,
        name,
        role,
        email,
        birthDate: birthDateInput,
        workType,
        success: false,
        error: "作成に失敗しました",
      });
    }
  }

  return NextResponse.json({ results });
}

export type { InputRow, ResultRow };
