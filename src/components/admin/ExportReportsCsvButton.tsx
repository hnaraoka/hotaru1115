"use client";

import { toCsv, downloadCsv } from "@/lib/csv";
import { REPORT_CSV_HEADER, reportToCsvRow, type ExportableReport } from "@/lib/reportCsv";

export function ExportReportsCsvButton({
  reports,
  filename,
}: {
  reports: ExportableReport[];
  filename: string;
}) {
  function handleExport() {
    const rows = [[...REPORT_CSV_HEADER], ...reports.map(reportToCsvRow)];
    downloadCsv(filename, toCsv(rows));
  }

  return (
    <button type="button" className="btn btn-primary" onClick={handleExport} disabled={reports.length === 0}>
      CSVで出力（{reports.length}件）
    </button>
  );
}
