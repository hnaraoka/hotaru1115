"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkExternalSubmissionButton({
  userId,
  userName,
  targetYear,
  targetMonth,
  marked,
}: {
  userId: string;
  userName: string;
  targetYear: number;
  targetMonth: number;
  marked: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMark() {
    const note = prompt(
      `${userName}さんの${targetYear}年${targetMonth}月分を「確認済み（外部提出）」にします。メモ（任意、例: LINE WORKSドライブで確認）:`,
    );
    if (note === null) return;
    setPending(true);
    setError(null);
    const res = await fetch("/api/admin/external-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, targetYear, targetMonth, note: note || undefined }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "登録に失敗しました");
      return;
    }
    router.refresh();
  }

  async function handleUnmark() {
    if (!confirm(`${userName}さんの${targetYear}年${targetMonth}月分の「確認済み（外部提出）」を取り消しますか？`)) return;
    setPending(true);
    setError(null);
    const res = await fetch(
      `/api/admin/external-submissions?userId=${encodeURIComponent(userId)}&targetYear=${targetYear}&targetMonth=${targetMonth}`,
      { method: "DELETE" },
    );
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "取り消しに失敗しました");
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ fontSize: 12, padding: "4px 10px" }}
        onClick={marked ? handleUnmark : handleMark}
        disabled={pending}
      >
        {pending ? "処理中..." : marked ? "確認を取り消す" : "外部提出を確認済みにする"}
      </button>
      {error && <span style={{ color: "var(--danger)", fontSize: 11 }}>{error}</span>}
    </div>
  );
}
