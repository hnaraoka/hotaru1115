import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentTargetMonthJst } from "@/lib/reminder";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function Home({ searchParams }: Props) {
  const session = await auth();
  const user = session!.user;

  const params = await searchParams;
  const yearParam = firstParam(params.year);
  const selectedYear = /^\d{4}$/.test(yearParam) ? Number(yearParam) : null;
  const keyword = firstParam(params.q).trim();
  const isFiltered = selectedYear !== null || keyword !== "";

  const where: Prisma.ReportWhereInput = { userId: user.id };
  if (selectedYear !== null) where.targetYear = selectedYear;
  if (keyword !== "") {
    where.OR = [
      { clientCompany: { contains: keyword, mode: "insensitive" } },
      { projectName: { contains: keyword, mode: "insensitive" } },
    ];
  }

  const [reports, yearRows, current] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: [{ targetYear: "desc" }, { targetMonth: "desc" }, { createdAt: "desc" }],
    }),
    prisma.report.findMany({
      where: { userId: user.id },
      select: { targetYear: true },
      distinct: ["targetYear"],
      orderBy: { targetYear: "desc" },
    }),
    (async () => {
      const { year, month } = currentTargetMonthJst();
      const report = await prisma.report.findUnique({
        where: { userId_targetYear_targetMonth: { userId: user.id, targetYear: year, targetMonth: month } },
        select: { id: true },
      });
      return { year, month, submitted: !!report };
    })(),
  ]);

  const years = yearRows.map((r) => r.targetYear);
  const hasAnyReport = years.length > 0;

  const reportsByYear = new Map<number, typeof reports>();
  for (const report of reports) {
    const group = reportsByYear.get(report.targetYear);
    if (group) group.push(report);
    else reportsByYear.set(report.targetYear, [report]);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>月次報告書一覧</h1>
          <p>ようこそ、{user.name} さん。</p>
        </div>
        <Link href="/reports/new" className="btn btn-primary">
          ＋ 新規作成
        </Link>
      </div>

      {hasAnyReport && !current.submitted && (
        <div className="reminder-banner">
          <span>
            今月分（{current.year}年{current.month}月）の報告書はまだ提出されていません。
          </span>
          <Link href="/reports/new" className="btn btn-secondary">
            作成する
          </Link>
        </div>
      )}

      {hasAnyReport && (
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <form method="get" className="filter-form">
            <div className="field" style={{ width: 120 }}>
              <label htmlFor="year">対象年</label>
              <select id="year" name="year" defaultValue={selectedYear ?? ""}>
                <option value="">全期間</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}年
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 180 }}>
              <label htmlFor="q">参画先企業・プロジェクト名</label>
              <input id="q" name="q" defaultValue={keyword} placeholder="キーワードで絞り込み" />
            </div>
            <button type="submit" className="btn btn-secondary">
              絞り込む
            </button>
            {isFiltered && (
              <Link href="/" className="btn btn-secondary">
                クリア
              </Link>
            )}
          </form>
        </div>
      )}

      {!hasAnyReport && (
        <div className="empty-state">
          <p>まだ報告書がありません。</p>
          <p>
            <Link href="/reports/new">最初の月次報告書を作成する</Link>
          </p>
        </div>
      )}

      {hasAnyReport && reports.length === 0 && (
        <div className="empty-state">
          <p>条件に一致する報告書がありません。</p>
          <p>
            <Link href="/">絞り込みをクリアする</Link>
          </p>
        </div>
      )}

      {[...reportsByYear.entries()].map(([year, yearReports]) => (
        <section key={year} style={{ marginBottom: 24 }}>
          <div className="year-heading">
            <span>{year}年</span>
            <span className="year-heading-count">{yearReports.length}件</span>
          </div>
          <ul className="report-list">
            {yearReports.map((report) => (
              <li key={report.id}>
                <Link href={`/reports/${report.id}`} className="report-item">
                  <div className="report-item-top">
                    <span className="report-item-title">
                      {report.clientCompany} / {report.projectName}
                    </span>
                    <span className="report-item-period">
                      {report.targetYear}年{report.targetMonth}月
                    </span>
                  </div>
                  <div className="report-item-meta">
                    <span>作業場所: {report.workLocation}</span>
                    <span>更新: {new Date(report.updatedAt).toLocaleDateString("ja-JP")}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
