"use client";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export function DeleteReportButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      confirmMessage="この報告書を削除しますか？この操作は取り消せません。"
      deleteUrl={`/api/reports/${id}`}
      redirectTo="/"
      label="削除"
    />
  );
}
