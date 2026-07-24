"use client";

import { toCsv, downloadCsv } from "@/lib/csv";
import { USER_CSV_HEADER, userToCsvRow, type ExportableUser } from "@/lib/adminUserCsv";

export function ExportUsersCsvButton({ users }: { users: ExportableUser[] }) {
  function handleExport() {
    const rows = [[...USER_CSV_HEADER], ...users.map(userToCsvRow)];
    downloadCsv("ユーザー一覧.csv", toCsv(rows));
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={handleExport}>
      CSVで出力
    </button>
  );
}
