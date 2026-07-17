import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeleteReportButton } from "@/components/DeleteReportButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id } });

  if (!report) {
    notFound();
  }

  return (
    <>
      <Link href="/" className="back-link">
        ← 一覧に戻る
      </Link>

      <div className="detail-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{report.title}</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            {report.year}年{report.month}月分 月次報告書
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="btn btn-secondary" href={`/api/reports/${report.id}/pdf`} target="_blank" rel="noopener noreferrer">
            PDFを開く
          </a>
          <a className="btn btn-primary" href={`/api/reports/${report.id}/pdf`} download>
            PDFをダウンロード
          </a>
          <DeleteReportButton id={report.id} />
        </div>
      </div>

      <div className="detail-meta">
        <div className="detail-meta-item">
          <div className="label">対象年月</div>
          <div className="value">
            {report.year}年{report.month}月
          </div>
        </div>
        <div className="detail-meta-item">
          <div className="label">作成者</div>
          <div className="value">{report.author}</div>
        </div>
        {report.department && (
          <div className="detail-meta-item">
            <div className="label">部署</div>
            <div className="value">{report.department}</div>
          </div>
        )}
        <div className="detail-meta-item">
          <div className="label">更新日時</div>
          <div className="value">{new Date(report.updatedAt).toLocaleString("ja-JP")}</div>
        </div>
      </div>

      <DetailSection heading="概要" body={report.summary} />
      <DetailSection heading="今月の実績" body={report.achievements} />
      <DetailSection heading="課題・問題点" body={report.issues} />
      <DetailSection heading="来月の予定" body={report.nextPlan} />
      <DetailSection heading="その他・備考" body={report.notes} />
    </>
  );
}

function DetailSection({ heading, body }: { heading: string; body: string | null }) {
  if (!body) return null;
  return (
    <div className="detail-section">
      <h2>{heading}</h2>
      <p>{body}</p>
    </div>
  );
}
