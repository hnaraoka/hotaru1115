import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/requireAdmin";
import { generateInitialPassword, hashPassword } from "@/lib/password";
import { normalizeGender } from "@/lib/constants";

type InputRow = {
  loginId: string;
  name: string;
  role: "ADMIN" | "USER";
  email: string | null;
  birthDate: string | null;
  gender: string | null;
  workType: "ENGINEER" | "OFFICE";
};

type ResultRow = {
  loginId: string;
  name: string;
  role: "ADMIN" | "USER";
  email: string | null;
  birthDate: string | null;
  gender: string | null;
  workType: "ENGINEER" | "OFFICE";
  success: boolean;
  action: "created" | "updated";
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
    const gender = normalizeGender(r.gender);
    const workType = parseWorkType(r.workType);

    const fail = (error: string, action: ResultRow["action"] = "created") =>
      results.push({
        loginId,
        name,
        role,
        email,
        birthDate: birthDateInput || null,
        gender,
        workType,
        success: false,
        action,
        error,
      });

    if (!loginId || !name) {
      fail("ログインIDと氏名は必須です");
      continue;
    }
    if (seenLoginIds.has(loginId)) {
      fail("CSV内でログインIDが重複しています");
      continue;
    }
    seenLoginIds.add(loginId);

    if (birthDateInput === "") {
      fail("生年月日は必須です");
      continue;
    }
    const birthDate = new Date(birthDateInput);
    if (Number.isNaN(birthDate.getTime())) {
      fail("生年月日の指定が正しくありません");
      continue;
    }

    // ログインIDが既存ユーザーと一致する行は情報を更新し(パスワードは変更しない)、
    // 一致しない行は初期パスワードを発行して新規作成する。
    const existing = await prisma.user.findUnique({ where: { loginId } });
    const action: "created" | "updated" = existing ? "updated" : "created";

    if (existing) {
      try {
        await prisma.user.update({
          where: { loginId },
          data: { name, role, email, birthDate, gender, workType },
        });
        results.push({
          loginId,
          name,
          role,
          email,
          birthDate: birthDateInput,
          gender,
          workType,
          success: true,
          action,
        });
      } catch {
        fail("更新に失敗しました", action);
      }
      continue;
    }

    const initialPassword = generateInitialPassword();
    try {
      await prisma.user.create({
        data: {
          loginId,
          name,
          role,
          email,
          birthDate,
          gender,
          workType,
          passwordHash: await hashPassword(initialPassword),
        },
      });
      results.push({
        loginId,
        name,
        role,
        email,
        birthDate: birthDateInput,
        gender,
        workType,
        success: true,
        action,
        initialPassword,
      });
    } catch {
      fail("作成に失敗しました", action);
    }
  }

  return NextResponse.json({ results });
}

export type { InputRow, ResultRow };
