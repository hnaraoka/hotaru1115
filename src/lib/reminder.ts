import { prisma } from "@/lib/prisma";
import { notifySubmissionReminder } from "@/lib/notify";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 提出対象の「今月」はJST基準で判定する（サーバーはUTCで動く前提）。
export function currentTargetMonthJst(): { year: number; month: number } {
  const jstNow = new Date(Date.now() + JST_OFFSET_MS);
  return { year: jstNow.getUTCFullYear(), month: jstNow.getUTCMonth() + 1 };
}

// 月次報告書は「前月分を今月5日までに提出する」運用のため、リマインド対象
// の月は常に前月になる。
export function previousTargetMonthJst(): { year: number; month: number } {
  const jstNow = new Date(Date.now() + JST_OFFSET_MS);
  const firstOfThisMonth = Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), 1);
  const lastMonth = new Date(firstOfThisMonth - 1);
  return { year: lastMonth.getUTCFullYear(), month: lastMonth.getUTCMonth() + 1 };
}

export type ReminderSummary = {
  targetYear: number;
  targetMonth: number;
  unsubmitted: number;
  emailed: number;
  withoutEmail: number;
};

export async function sendSubmissionReminders(
  targetYear: number,
  targetMonth: number,
  triggeredBy: "cron" | "manual",
): Promise<ReminderSummary> {
  const [users, reports, externalSubmissions] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true, role: "USER" },
      select: { id: true, loginId: true, name: true, email: true },
    }),
    prisma.report.findMany({
      where: { targetYear, targetMonth, user: { role: "USER" } },
      select: { userId: true },
    }),
    prisma.externalSubmission.findMany({
      where: { targetYear, targetMonth, user: { role: "USER" } },
      select: { userId: true },
    }),
  ]);

  const submittedUserIds = new Set([
    ...reports.map((r) => r.userId),
    ...externalSubmissions.map((e) => e.userId),
  ]);
  const unsubmitted = users.filter((u) => !submittedUserIds.has(u.id));
  const withEmail = unsubmitted.filter((u) => u.email);

  let emailed = 0;
  for (const user of withEmail) {
    const sent = await notifySubmissionReminder(user, targetYear, targetMonth);
    if (sent) emailed++;
  }

  const sourceLabel = triggeredBy === "cron" ? "自動リマインド" : "リマインド";
  const message =
    unsubmitted.length === 0
      ? `${targetYear}年${targetMonth}月分は全員提出済みのため、${sourceLabel}は送信されませんでした。`
      : `${targetYear}年${targetMonth}月分の${sourceLabel}を送信しました（未提出${unsubmitted.length}名 / メール送信${emailed}名 / メール未登録${unsubmitted.length - withEmail.length}名）。`;
  await prisma.notification.create({ data: { message } });

  return {
    targetYear,
    targetMonth,
    unsubmitted: unsubmitted.length,
    emailed,
    withoutEmail: unsubmitted.length - withEmail.length,
  };
}
