import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const user = session!.user;

  const reports = await prisma.report.findMany({
    where: { userId: user.id },
    orderBy: [{ targetYear: "desc" }, { targetMonth: "desc" }, { createdAt: "desc" }],
  });

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

      {reports.length === 0 && (
        <div className="empty-state">
          <p>まだ報告書がありません。</p>
          <p>
            <Link href="/reports/new">最初の月次報告書を作成する</Link>
          </p>
        </div>
      )}

      {reports.length > 0 && (
        <ul className="report-list">
          {reports.map((report) => (
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
      )}
    </>
  );
}
