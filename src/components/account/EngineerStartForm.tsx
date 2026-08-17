"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MONTH_OPTIONS } from "@/lib/constants";

export function EngineerStartForm({
  initialYear,
  initialMonth,
}: {
  initialYear: number | null;
  initialMonth: number | null;
}) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear != null ? String(initialYear) : "");
  const [month, setMonth] = useState(initialMonth != null ? String(initialMonth) : "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const res = await fetch("/api/account/engineer-start", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineerStartYear: Number(year), engineerStartMonth: Number(month) }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "保存に失敗しました");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {success && <div className="carry-over-done">エンジニア開始年月を変更しました。</div>}

      <form className="form" onSubmit={handleSubmit}>
        <p>月次報告書の「経験年数」を自動計算するために使われます。</p>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-row">
          <div className="field">
            <label htmlFor="engineerStartYear">開始年 *</label>
            <input
              id="engineerStartYear"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="例: 2020"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="engineerStartMonth">開始月 *</label>
            <select id="engineerStartMonth" value={month} onChange={(e) => setMonth(e.target.value)} required>
              <option value="" disabled>
                選択してください
              </option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "保存中..." : "変更を保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
