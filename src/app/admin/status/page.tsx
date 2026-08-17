import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MONTH_OPTIONS } from "@/lib/constants";
import { SendRemindersButton } from "@/components/admin/SendRemindersButton";
import { MarkExternalSubmissionButton } from "@/components/admin/MarkExternalSubmissionButton";
import { CopyTextButton } from "@/components/admin/CopyTextButton";
import { DriveFileMatchPanel } from "@/components/admin/DriveFileMatchPanel";
import { previousTargetMonthJst } from "@/lib/reminder";
import { requireAdminPageSession } from "@/lib/requireAdminPage";
import { computeReviewFlags } from "@/lib/reportFlags";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { ADMIN: "管理者", USER: "一般" };

// 提出状況一覧の統合ステータス。
// - unsubmitted: 報告書もDrive確認もなし
// - needsRevision: 報告書はあるがレビューで差し戻し
// - created: 報告書はあるが未レビュー（Driveへの実提出は未確認）
// - submitted: レビュー承認済み、またはDriveのファイル名照合で確認済み
type StatusKey = "unsubmitted" | "needsRevision" | "created" | "submitted";

const STATUS_META: Record<StatusKey, { label: string; background: string; color: string }> = {
  unsubmitted: {
    label: "未提出",
    background: "color-mix(in srgb, var(--danger) 14%, transparent)",
    color: "var(--danger)",
  },
  needsRevision: {
    label: "差し戻し",
    background: "color-mix(in srgb, var(--danger) 14%, transparent)",
    color: "var(--danger)",
  },
  created: {
    label: "作成済み",
    background: "color-mix(in srgb, var(--warning) 16%, transparent)",
    color: "var(--warning-text)",
  },
  submitted: {
    label: "提出済み",
    background: "color-mix(in srgb, var(--success) 14%, transparent)",
    color: "var(--success)",
  },
};

const STATUS_FILTER_OPTIONS: { key: StatusKey; label: string }[] = [
  { key: "unsubmitted", label: STATUS_META.unsubmitted.label },
  { key: "needsRevision", label: STATUS_META.needsRevision.label },
  { key: "created", label: STATUS_META.created.label },
  { key: "submitted", label: STATUS_META.submitted.label },
];

function computeStatusKey(
  report: { reviewStatus: string } | undefined,
  external: unknown,
): StatusKey {
  if (!report && !external) return "unsubmitted";
  if (report?.reviewStatus === "NEEDS_REVISION") return "needsRevision";
  if (report?.reviewStatus === "APPROVED" || external) return "submitted";
  return "created";
}

function parseIntParam(value: string | string[] | undefined, fallback: number): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

function parseStatusFilter(value: string | string[] | undefined): StatusKey[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const validKeys = STATUS_FILTER_OPTIONS.map((o) => o.key);
  return values.filter((v): v is StatusKey => (validKeys as string[]).includes(v));
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
  const sortDir: "asc" | "desc" = params.sort === "desc" ? "desc" : "asc";
  const statusFilter = parseStatusFilter(params.status);

  const [users, reports, externalSubmissions] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true, role: "USER" },
      orderBy: { loginId: sortDir },
      select: { id: true, name: true, loginId: true, role: true },
    }),
    prisma.report.findMany({
      where: { targetYear, targetMonth, user: { role: "USER" } },
      select: {
        id: true,
        userId: true,
        submittedAt: true,
        reviewStatus: true,
        workContent: true,
        deliverables: true,
        troubles: true,
        goodPoints: true,
        techStackItems: { select: { id: true } },
      },
    }),
    prisma.externalSubmission.findMany({
      where: { targetYear, targetMonth, user: { role: "USER" } },
      select: { userId: true, confirmedByName: true, note: true },
    }),
  ]);

  const reportByUserId = new Map(reports.map((r) => [r.userId, r]));
  const externalByUserId = new Map(externalSubmissions.map((e) => [e.userId, e]));
  const flagsByReportId = new Map(reports.map((r) => [r.id, computeReviewFlags(r)]));
  const statusByUserId = new Map(
    users.map((u) => [u.id, computeStatusKey(reportByUserId.get(u.id), externalByUserId.get(u.id))]),
  );
  const submittedCount = users.filter((u) => reportByUserId.has(u.id) || externalByUserId.has(u.id)).length;
  const unsubmittedUsers = users.filter((u) => !reportByUserId.has(u.id) && !externalByUserId.has(u.id));
  const thinContentCount = reports.filter((r) => (flagsByReportId.get(r.id)?.length ?? 0) > 0).length;
  const reminderText =
    unsubmittedUsers.length > 0
      ? `【月次報告書】${targetYear}年${targetMonth}月分の提出リマインドです。\n以下の方はまだ提出が確認できていません。お手数ですが確認・提出をお願いします。\n\n${unsubmittedUsers
          .map((u) => `・${u.name}`)
          .join("\n")}`
      : "";

  const displayUsers =
    statusFilter.length > 0 ? users.filter((u) => statusFilter.includes(statusByUserId.get(u.id)!)) : users;

  const prevMonth = targetMonth === 1 ? { year: targetYear - 1, month: 12 } : { year: targetYear, month: targetMonth - 1 };
  const nextMonth = targetMonth === 12 ? { year: targetYear + 1, month: 1 } : { year: targetYear, month: targetMonth + 1 };
  const navQuery = (y: number, m: number) => {
    const sp = new URLSearchParams({ year: String(y), month: String(m), sort: sortDir });
    for (const s of statusFilter) sp.append("status", s);
    return sp.toString();
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>提出状況</h1>
          <p>対象月ごとに、各ユーザーの月次報告書の提出状況を確認できます。</p>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        {/* 対象年月・並び順・絞り込みが変わるたびにフォームを再マウントし、
            select[defaultValue]/input[defaultChecked] の表示を確実に更新する */}
        <form
          method="get"
          key={`${targetYear}-${targetMonth}-${sortDir}-${statusFilter.join(",")}`}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
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
            <div className="field" style={{ width: 110 }}>
              <label htmlFor="sort">ログインID順</label>
              <select id="sort" name="sort" defaultValue={sortDir}>
                <option value="asc">昇順</option>
                <option value="desc">降順</option>
              </select>
            </div>
            <button type="submit" className="btn btn-secondary">
              表示
            </button>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <Link href={`/admin/status?${navQuery(prevMonth.year, prevMonth.month)}`} className="btn btn-secondary">
                ← 前月
              </Link>
              <Link href={`/admin/status?${navQuery(nextMonth.year, nextMonth.month)}`} className="btn btn-secondary">
                翌月 →
              </Link>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              ステータスで絞り込み（複数選択可。未選択の場合は全件表示）
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input type="checkbox" name="status" value={opt.key} defaultChecked={statusFilter.includes(opt.key)} />
                  {opt.label}
                </label>
              ))}
              <button type="submit" className="btn btn-secondary">
                絞り込む
              </button>
              {statusFilter.length > 0 && (
                <Link href={`/admin/status?year=${targetYear}&month=${targetMonth}&sort=${sortDir}`} className="btn btn-secondary">
                  絞り込みをクリア
                </Link>
              )}
            </div>
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
            {thinContentCount > 0 && (
              <>
                {" / "}
                <strong style={{ color: "var(--warning-text)" }}>{thinContentCount}人内容が薄い</strong>
              </>
            )}
            {statusFilter.length > 0 && (
              <>
                {" / "}
                <span style={{ color: "var(--muted)" }}>絞り込み中: {displayUsers.length}人表示</span>
              </>
            )}
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
        {displayUsers.map((u) => {
          const report = reportByUserId.get(u.id);
          const external = externalByUserId.get(u.id);
          const flags = report ? (flagsByReportId.get(report.id) ?? []) : [];
          const statusKey = statusByUserId.get(u.id)!;
          const badge = STATUS_META[statusKey];
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
                      <span className="report-item-period" style={{ background: badge.background, color: badge.color }}>
                        {badge.label}
                      </span>
                      {flags.length > 0 && (
                        <span
                          className="report-item-period"
                          title={flags.join("\n")}
                          style={{
                            background: "color-mix(in srgb, var(--warning) 16%, transparent)",
                            color: "var(--warning-text)",
                          }}
                        >
                          内容が薄い（{flags.length}件）
                        </span>
                      )}
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
                    <span className="report-item-period" style={{ background: badge.background, color: badge.color }}>
                      {external ? "提出済み（Driveに提出済み）" : badge.label}
                    </span>
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
      {users.length > 0 && displayUsers.length === 0 && (
        <div className="empty-state">絞り込み条件に一致するユーザーがいません。</div>
      )}
    </>
  );
}
