import { NextRequest, NextResponse } from "next/server";
import { previousTargetMonthJst, sendSubmissionReminders } from "@/lib/reminder";

export const runtime = "nodejs";

// Vercel Cron から毎月呼び出されるエンドポイント（vercel.json 参照）。
// Vercel は CRON_SECRET 環境変数が設定されていると Authorization: Bearer <CRON_SECRET>
// を自動で付与する。手元から動作確認する場合も同じヘッダーを付ければよい。
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET が未設定のため、自動リマインドは無効です。" },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "権限がありません" }, { status: 401 });
  }

  const { year, month } = previousTargetMonthJst();
  const summary = await sendSubmissionReminders(year, month, "cron");
  return NextResponse.json(summary);
}
