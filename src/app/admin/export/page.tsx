import { prisma } from "@/lib/prisma";
import { requireAdminPageSession } from "@/lib/requireAdminPage";
import { currentTargetMonthJst } from "@/lib/reminder";
import { ExportReportsCsvButton } from "@/components/admin/ExportReportsCsvButton";

export const dynamic = "force-dynamic";

function parseIntParam(value: string | string[] | undefined, fallback: number): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminExportPage({ searchParams }: Props) {
  await requireAdminPageSession();

  const params = await searchParams;
  const currentYear = currentTargetMonthJst().year;

  const yearCounts = await prisma.report.groupBy({
    by: ["targetYear"],
    _count: { _all: true },
    orderBy: { targetYear: "asc" },
  });
  const dataYears = yearCounts.map((y) => y.targetYear);
  const minYear = dataYears.length > 0 ? Math.min(...dataYears) : currentYear;
  const maxYear = dataYears.length > 0 ? Math.max(...dataYears) : currentYear;
  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  const fromYear = parseIntParam(params.from, minYear);
  const toYear = parseIntParam(params.to, maxYear);

  const reports = await prisma.report.findMany({
    where: { targetYear: { gte: fromYear, lte: toYear } },
    include: {
      user: { select: { name: true, loginId: true } },
      techStackItems: { orderBy: { sortOrder: "asc" } },
      workAllocations: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ targetYear: "asc" }, { targetMonth: "asc" }, { user: { loginId: "asc" } }],
  });

  const totalCount = yearCounts.reduce((sum, y) => sum + y._count._all, 0);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>データ出力</h1>
          <p>
            月次報告書を年単位でCSVに一括出力できます。ストレージ容量が逼迫した際は、古いデータをここで出力してから削除する運用にご利用ください。
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          現在保存されている月次報告書は全部で <strong>{totalCount}件</strong>
          {yearCounts.length > 0 && (
            <>
              （
              {yearCounts.map((y, i) => (
                <span key={y.targetYear}>
                  {i > 0 && "、"}
                  {y.targetYear}年: {y._count._all}件
                </span>
              ))}
              ）
            </>
          )}
          です。
        </div>

        <form
          method="get"
          key={`${fromYear}-${toYear}`}
          style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}
        >
          <div className="field" style={{ width: 110 }}>
            <label htmlFor="from">対象年（開始）</label>
            <select id="from" name="from" defaultValue={fromYear}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ width: 110 }}>
            <label htmlFor="to">対象年（終了）</label>
            <select id="to" name="to" defaultValue={toYear}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary">
            絞り込む
          </button>
          <div style={{ marginLeft: "auto" }}>
            <ExportReportsCsvButton reports={reports} filename={`月次報告書_${fromYear}-${toYear}.csv`} />
          </div>
        </form>
      </div>

      <p style={{ fontSize: 13, color: "var(--muted)" }}>
        出力対象: {fromYear}年〜{toYear}年（{reports.length}件）。技術スタック・作業配分の内訳も1行にまとめて出力されます。
        出力後にデータを削除する場合は、必ず出力したCSVの内容を確認してから行ってください。
      </p>
    </>
  );
}
