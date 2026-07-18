import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/requireAdmin";
import { currentTargetMonthJst, sendSubmissionReminders } from "@/lib/reminder";

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const current = currentTargetMonthJst();
  const year = Number.isInteger(body.year) && body.year >= 2000 && body.year <= 2100 ? body.year : current.year;
  const month = Number.isInteger(body.month) && body.month >= 1 && body.month <= 12 ? body.month : current.month;

  const summary = await sendSubmissionReminders(year, month, "manual");
  return NextResponse.json(summary);
}
