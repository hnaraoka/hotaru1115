"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteReportsByYearButton({ year, count }: { year: number; count: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const typed = prompt(
      `${year}年分の月次報告書 ${count}件を完全に削除します。この操作は取り消せません。\n` +
        `CSVでの出力・保存が完了していることを確認のうえ、確認のため対象年（${year}）を入力してください。`,
    );
    if (typed === null) return;
    if (typed.trim() !== String(year)) {
      alert("入力された年が一致しなかったため、削除を中止しました。");
      return;
    }
    if (!confirm(`最終確認: ${year}年分の月次報告書 ${count}件を削除します。よろしいですか？`)) return;

    setDeleting(true);
    const res = await fetch("/api/admin/reports/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`${data.deletedCount}件の月次報告書を削除しました。`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "削除に失敗しました");
      setDeleting(false);
    }
  }

  return (
    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting || count === 0}>
      {deleting ? "削除中..." : `${year}年分を削除`}
    </button>
  );
}
