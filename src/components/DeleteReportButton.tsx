"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteReportButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("この報告書を削除しますか？この操作は取り消せません。")) return;
    setDeleting(true);
    const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      alert("削除に失敗しました");
      setDeleting(false);
    }
  }

  return (
    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
      {deleting ? "削除中..." : "削除"}
    </button>
  );
}
