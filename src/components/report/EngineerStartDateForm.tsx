"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MONTH_OPTIONS } from "@/lib/constants";

export function EngineerStartDateForm() {
  const router = useRouter();
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/account/engineer-start", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineerStartYear: Number(year), engineerStartMonth: Number(month) }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "保存に失敗しました");
      setSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p>
        月次報告書の「経験年数」を自動計算するため、最初の1回だけ、エンジニアとしてのキャリアを開始した年月を教えてください。次回以降は表示されません。
      </p>
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
          {submitting ? "保存中..." : "次へ進む"}
        </button>
      </div>
    </form>
  );
}
