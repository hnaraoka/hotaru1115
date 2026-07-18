import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/requireAdmin";
import { generateInitialPassword, hashPassword } from "@/lib/password";

type InputRow = { loginId: string; name: string; role: "ADMIN" | "USER"; email: string | null };

type ResultRow = {
  loginId: string;
  name: string;
  role: "ADMIN" | "USER";
  email: string | null;
  success: boolean;
  initialPassword?: string;
  error?: string;
};

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

    if (!loginId || !name) {
      results.push({ loginId, name, role, email, success: false, error: "ログインIDと氏名は必須です" });
      continue;
    }
    if (seenLoginIds.has(loginId)) {
      results.push({ loginId, name, role, email, success: false, error: "CSV内でログインIDが重複しています" });
      continue;
    }
    seenLoginIds.add(loginId);

    const existing = await prisma.user.findUnique({ where: { loginId } });
    if (existing) {
      results.push({ loginId, name, role, email, success: false, error: "このログインIDは既に使用されています" });
      continue;
    }

    const initialPassword = generateInitialPassword();
    try {
      await prisma.user.create({
        data: { loginId, name, role, email, passwordHash: await hashPassword(initialPassword) },
      });
      results.push({ loginId, name, role, email, success: true, initialPassword });
    } catch {
      results.push({ loginId, name, role, email, success: false, error: "作成に失敗しました" });
    }
  }

  return NextResponse.json({ results });
}

export type { InputRow, ResultRow };
