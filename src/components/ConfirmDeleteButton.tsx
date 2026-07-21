"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConfirmDeleteButton({
  confirmMessage,
  deleteUrl,
  redirectTo,
  label,
  deletingLabel = "削除中...",
  errorFallbackMessage = "削除に失敗しました",
}: {
  confirmMessage: string;
  deleteUrl: string;
  redirectTo: string;
  label: string;
  deletingLabel?: string;
  errorFallbackMessage?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmMessage)) return;
    setDeleting(true);
    const res = await fetch(deleteUrl, { method: "DELETE" });
    if (res.ok) {
      router.push(redirectTo);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? errorFallbackMessage);
      setDeleting(false);
    }
  }

  return (
    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
      {deleting ? deletingLabel : label}
    </button>
  );
}
