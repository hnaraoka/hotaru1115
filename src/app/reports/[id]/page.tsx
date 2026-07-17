import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeleteReportButton } from "@/components/report/DeleteReportButton";
import { ratingLabel, formatProjectPeriod } from "@/lib/format";
import { RATING_FIELDS, TECH_CATEGORY_OPTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ReportDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: { techStackItems: true, workAllocations: true },
  });

  if (!report) notFound();
  if (report.userId !== session.user.id && session.user.role !== "ADMIN") notFound();

  const techByCategory = TECH_CATEGORY_OPTIONS.map(({ value, label }) => ({
    label,
    items: report.techStackItems.filter((t) => t.category === value).map((t) => t.name),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <Link href="/" className="back-link">
        ← 一覧に戻る
      </Link>

      <div className="detail-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>
            {report.clientCompany} / {report.projectName}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            {report.targetYear}年{report.targetMonth}月分 月次報告書
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={`/reports/${report.id}/edit`} className="btn btn-secondary">
            編集
          </Link>
          <DeleteReportButton id={report.id} />
        </div>
      </div>

      <div className="detail-meta">
        <div className="detail-meta-item">
          <div className="label">提出日</div>
          <div className="value">{new Date(report.submittedAt).toLocaleDateString("ja-JP")}</div>
        </div>
        <div className="detail-meta-item">
          <div className="label">対象年月</div>
          <div className="value">
            {report.targetYear}年{report.targetMonth}月
          </div>
        </div>
        {report.gender && (
          <div className="detail-meta-item">
            <div className="label">性別</div>
            <div className="value">{report.gender}</div>
          </div>
        )}
        {report.age !== null && (
          <div className="detail-meta-item">
            <div className="label">年齢</div>
            <div className="value">{report.age}</div>
          </div>
        )}
        {report.experienceYears !== null && (
          <div className="detail-meta-item">
            <div className="label">経験年数</div>
            <div className="value">{report.experienceYears}年</div>
          </div>
        )}
      </div>

      <div className="detail-meta">
        <div className="detail-meta-item">
          <div className="label">参画先企業</div>
          <div className="value">{report.clientCompany}</div>
        </div>
        <div className="detail-meta-item">
          <div className="label">作業場所</div>
          <div className="value">{report.workLocation}</div>
        </div>
        {report.workDays !== null && (
          <div className="detail-meta-item">
            <div className="label">実労働日数</div>
            <div className="value">{report.workDays}日</div>
          </div>
        )}
        {report.workHours !== null && (
          <div className="detail-meta-item">
            <div className="label">実労働時間</div>
            <div className="value">{report.workHours}時間</div>
          </div>
        )}
        {report.teleworkDays !== null && (
          <div className="detail-meta-item">
            <div className="label">テレワーク</div>
            <div className="value">{report.teleworkDays}日</div>
          </div>
        )}
        {report.onsiteDays !== null && (
          <div className="detail-meta-item">
            <div className="label">現場</div>
            <div className="value">{report.onsiteDays}日</div>
          </div>
        )}
      </div>

      {techByCategory.length > 0 && (
        <div className="detail-section">
          <h2>技術スタック</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {techByCategory.map((g) => (
              <div key={g.label}>
                <strong style={{ fontSize: 13 }}>{g.label}: </strong>
                <span style={{ fontSize: 13 }}>{g.items.join(" / ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="detail-section">
        <h2>プロジェクト期間</h2>
        <p>{formatProjectPeriod(report)}</p>
      </div>

      <div className="detail-section">
        <h2>作業内容</h2>
        <p>{report.workContent}</p>
      </div>

      <div className="detail-section">
        <h2>開発工程</h2>
        <p>{report.devProcesses.join(" / ")}</p>
      </div>

      {report.deliverables && (
        <div className="detail-section">
          <h2>成果物</h2>
          <p>{report.deliverables}</p>
        </div>
      )}

      {report.troubles && (
        <div className="detail-section">
          <h2>今月の困った点と対応・解決方法</h2>
          <p>{report.troubles}</p>
        </div>
      )}

      {report.goodPoints && (
        <div className="detail-section">
          <h2>今月の良かった点/改善提案など</h2>
          <p>{report.goodPoints}</p>
        </div>
      )}

      <div className="detail-section">
        <h2>自己評価</h2>
        <div className="detail-meta" style={{ border: "none", padding: 0 }}>
          {RATING_FIELDS.map(({ key, label }) => (
            <div className="detail-meta-item" key={key}>
              <div className="label">{label}</div>
              <div className="value">{ratingLabel(report[key])}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-section">
        <h2>作業配分</h2>
        <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {report.workAllocations
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((w) => (
              <li key={w.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span>{w.category}</span>
                <span>{w.percentage}%</span>
              </li>
            ))}
        </ul>
      </div>
    </>
  );
}
