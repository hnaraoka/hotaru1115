import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let reports: Awaited<ReturnType<typeof loadReports>> = [];
  let loadError: string | null = null;

  try {
    reports = await loadReports();
  } catch {
    loadError =
      "データベースに接続できませんでした。DATABASE_URL の設定とマイグレーションの実行を確認してください。";
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>月次報告書一覧</h1>
          <p>作成済みの月次報告書です。クリックすると詳細とPDFを確認できます。</p>
        </div>
        <Link href="/new" className="btn btn-primary">
          ＋ 新規作成
        </Link>
      </div>

      {loadError && <div className="error-banner">{loadError}</div>}

      {!loadError && reports.length === 0 && (
        <div className="empty-state">
          <p>まだ報告書がありません。</p>
          <p>
            <Link href="/new">最初の月次報告書を作成する</Link>
          </p>
        </div>
      )}

      {!loadError && reports.length > 0 && (
        <ul className="report-list">
          {reports.map((report) => (
            <li key={report.id}>
              <Link href={`/reports/${report.id}`} className="report-item">
                <div className="report-item-top">
                  <span className="report-item-title">{report.title}</span>
                  <span className="report-item-period">
                    {report.year}年{report.month}月
                  </span>
                </div>
                <div className="report-item-meta">
                  <span>作成者: {report.author}</span>
                  {report.department && <span>部署: {report.department}</span>}
                  <span>
                    更新: {new Date(report.updatedAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function loadReports() {
  return prisma.report.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
  });
}
