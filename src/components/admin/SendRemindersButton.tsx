"use client";

import { useState } from "react";

type Summary = {
  targetYear: number;
  targetMonth: number;
  unsubmitted: number;
  emailed: number;
  withoutEmail: number;
};

export function SendRemindersButton({
  year,
  month,
  unsubmittedCount,
}: {
  year: number;
  month: number;
  unsubmittedCount: number;
}) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!confirm(`${year}年${month}月分が未提出のユーザーへリマインドメールを送信しますか？`)) return;
    setSending(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/admin/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);

    if (!res.ok) {
      setError(data.error ?? "リマインドの送信に失敗しました");
      return;
    }
    setResult(data as Summary);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSend}
        disabled={sending || unsubmittedCount === 0}
      >
        {sending ? "送信中..." : "未提出者にリマインドを送る"}
      </button>
      {result && (
        <span className="carry-over-done">
          送信しました（メール送信{result.emailed}名 / メール未登録{result.withoutEmail}名）
        </span>
      )}
      {error && <span style={{ color: "var(--danger)", fontSize: 12 }}>{error}</span>}
    </div>
  );
}
