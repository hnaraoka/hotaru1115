import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MONTH_OPTIONS } from "@/lib/constants";
import { SendRemindersButton } from "@/components/admin/SendRemindersButton";
import { MarkExternalSubmissionButton } from "@/components/admin/MarkExternalSubmissionButton";
import { CopyTextButton } from "@/components/admin/CopyTextButton";
import { DriveFileMatchPanel } from "@/components/admin/DriveFileMatchPanel";
import { previousTargetMonthJst } from "@/lib/reminder";
import { reviewStatusLabel, reviewStatusColor } from "@/lib/format";
import { requireAdminPageSession } from "@/lib/requireAdminPage";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { ADMIN: "管理者", USER: "一般" };

function parseIntParam(value: string | string[] | undefined, fallback: number): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

function yearOptions(centerYear: number): number[] {
  return Array.from({ length: 6 }, (_, i) => centerYear - 3 + i);
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminStatusPage({ searchParams }: Props) {
  await requireAdminPageSession();

  const params = await searchParams;
  const defaultTarget = previousTargetMonthJst();
  const targetYear = parseIntParam(params.year, defaultTarget.year);
  const targetMonth = parseIntParam(params.month, defaultTarget.month);

  const [users, reports, externalSubmissions] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, loginId: true, role: true },
    }),
    prisma.report.findMany({
      where: { targetYear, targetMonth },
      select: { id: true, userId: true, submittedAt: true, reviewStatus: true },
    }),
    prisma.externalSubmission.findMany({
      where: { targetYear, targetMonth },
      select: { userId: true, confirmedByName: true, note: true },
    }),
  ]);

  const reportByUserId = new Map(reports.map((r) => [r.userId, r]));
  const externalByUserId = new Map(externalSubmissions.map((e) => [e.userId, e]));
  const submittedCount = users.filter((u) => reportByUserId.has(u.id) || externalByUserId.has(u.id)).length;
  const unsubmittedUsers = users.filter((u) => !reportByUserId.has(u.id) && !externalByUserId.has(u.id));
  const reminderText =
    unsubmittedUsers.length > 0
      ? `【月次報告書】${targetYear}年${targetMonth}月分の提出リマインドです。\n以下の方はまだ提出が確認できていません。お手数ですが確認・提出をお願いします。\n\n${unsubmittedUsers
          .map((u) => `・${u.name}`)
          .join("\n")}`
      : "";

  const prevMonth = targetMonth === 1 ? { year: targetYear - 1, month: 12 } : { year: targetYear, month: targetMonth - 1 };
  const nextMonth = targetMonth === 12 ? { year: targetYear + 1, month: 1 } : { year: targetYear, month: targetMonth + 1 };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>提出状況</h1>
          <p>対象月ごとに、各ユーザーの月次報告書の提出状況を確認できます。</p>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <form method="get" style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div className="field" style={{ width: 110 }}>
            <label htmlFor="year">対象年</label>
            <select id="year" name="year" defaultValue={targetYear}>
              {yearOptions(defaultTarget.year).map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ width: 90 }}>
            <label htmlFor="month">対象月</label>
            <select id="month" name="month" defaultValue={targetMonth}>
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary">
            表示
          </button>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <Link
              href={`/admin/status?year=${prevMonth.year}&month=${prevMonth.month}`}
              className="btn btn-secondary"
            >
              ← 前月
            </Link>
            <Link
              href={`/admin/status?year=${nextMonth.year}&month=${nextMonth.month}`}
              className="btn btn-secondary"
            >
              翌月 →
            </Link>
          </div>
        </form>
      </div>

      <div style={{ marginBottom: 20 }}>
        <DriveFileMatchPanel targetYear={targetYear} targetMonth={targetMonth} />
      </div>

      <div className="page-heading" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            {targetYear}年{targetMonth}月分
          </h2>
          <p>
            {users.length}人中 <strong>{submittedCount}人提出済み</strong>（{users.length - submittedCount}人未提出）
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {unsubmittedUsers.length > 0 && (
            <CopyTextButton text={reminderText} label="LINE WORKS用の文面をコピー" />
          )}
          <SendRemindersButton
            year={targetYear}
            month={targetMonth}
            unsubmittedCount={users.length - submittedCount}
          />
        </div>
      </div>

      <ul className="report-list">
        {users.map((u) => {
          const report = reportByUserId.get(u.id);
          const external = externalByUserId.get(u.id);
          return (
            <li key={u.id}>
              {report ? (
                <Link
                  href={`/reports/${report.id}?from=status&year=${targetYear}&month=${targetMonth}`}
                  className="report-item"
                >
                  <div className="report-item-top">
                    <span className="report-item-title">{u.name}</span>
                    <span style={{ display: "flex", gap: 6 }}>
                      <span
                        className="report-item-period"
                        style={{ background: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)" }}
                      >
                        提出済み
                      </span>
                      <span
                        className="report-item-period"
                        style={{
                          background: `color-mix(in srgb, ${reviewStatusColor(report.reviewStatus)} 14%, transparent)`,
                          color: reviewStatusColor(report.reviewStatus),
                        }}
                      >
                        {reviewStatusLabel(report.reviewStatus)}
                      </span>
                    </span>
                  </div>
                  <div className="report-item-meta">
                    <span>ログインID: {u.loginId}</span>
                    <span>{ROLE_LABEL[u.role]}</span>
                    <span>提出日: {new Date(report.submittedAt).toLocaleDateString("ja-JP")}</span>
                  </div>
                </Link>
              ) : (
                <div className="report-item" style={{ cursor: "default" }}>
                  <div className="report-item-top">
                    <span className="report-item-title">{u.name}</span>
                    {external ? (
                      <span
                        className="report-item-period"
                        style={{ background: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)" }}
                      >
                        確認済み（外部提出）
                      </span>
                    ) : (
                      <span
                        className="report-item-period"
                        style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}
                      >
                        未提出
                      </span>
                    )}
                  </div>
                  <div className="report-item-meta">
                    <span>ログインID: {u.loginId}</span>
                    <span>{ROLE_LABEL[u.role]}</span>
                    {external && (
                      <span>
                        確認者: {external.confirmedByName}
                        {external.note ? `（${external.note}）` : ""}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <MarkExternalSubmissionButton
                      userId={u.id}
                      userName={u.name}
                      targetYear={targetYear}
                      targetMonth={targetMonth}
                      marked={!!external}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {users.length === 0 && <div className="empty-state">有効なユーザーがいません。</div>}
    </>
  );
}
