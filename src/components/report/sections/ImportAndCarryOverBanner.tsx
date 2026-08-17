import type { Report, TechStackItem, WorkAllocation } from "@prisma/client";

type ReportWithRelations = Report & { techStackItems: TechStackItem[]; workAllocations: WorkAllocation[] };

export function ImportAndCarryOverBanner({
  latestReport,
  latestChecked,
  carriedOver,
  onApplyCarryOver,
  importing,
  imported,
  importError,
  importWarnings,
  onImportExcel,
}: {
  latestReport: ReportWithRelations | null;
  latestChecked: boolean;
  carriedOver: boolean;
  onApplyCarryOver: () => void;
  importing: boolean;
  imported: boolean;
  importError: string | null;
  importWarnings: string[];
  onImportExcel: (file: File) => void;
}) {
  return (
    <>
      {latestReport && (
        <div className="carry-over-banner">
          <span>
            前回（{latestReport.targetYear}年{latestReport.targetMonth}月分）のデータがあります。
          </span>
          <button type="button" className="btn btn-secondary" onClick={onApplyCarryOver}>
            前回のデータを引き継ぐ
          </button>
          {carriedOver && <span className="carry-over-done">引き継ぎました</span>}
        </div>
      )}
      {latestChecked && !latestReport && (
        <div className="carry-over-banner">
          <span>引き継げる過去の報告書はありません（今回が初回作成です）。</span>
        </div>
      )}

      <div className="carry-over-banner">
        <span style={{ flexBasis: "100%" }}>
          過去に作成した月次報告書のExcelファイルがあれば、読み込んでフォームに自動入力できます。
        </span>
        <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
          {importing ? "読み込み中..." : "Excelから読み込む"}
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            style={{ display: "none" }}
            disabled={importing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onImportExcel(file);
            }}
          />
        </label>
        {imported && !importError && <span className="carry-over-done">読み込みました</span>}
      </div>

      {importError && <div className="error-banner">{importError}</div>}
      {importWarnings.length > 0 && (
        <div
          className="error-banner"
          style={{
            color: "var(--warning-text)",
            background: "color-mix(in srgb, var(--warning) 16%, transparent)",
            borderColor: "var(--warning)",
          }}
        >
          <ul style={{ paddingLeft: 18 }}>
            {importWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <div>読み込んだ内容は必ずご確認・修正のうえ保存してください。</div>
        </div>
      )}
    </>
  );
}
