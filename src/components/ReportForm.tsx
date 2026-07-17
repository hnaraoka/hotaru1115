"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const now = new Date();

export function ReportForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: formData.get("title"),
      year: Number(formData.get("year")),
      month: Number(formData.get("month")),
      author: formData.get("author"),
      department: formData.get("department"),
      summary: formData.get("summary"),
      achievements: formData.get("achievements"),
      issues: formData.get("issues"),
      nextPlan: formData.get("nextPlan"),
      notes: formData.get("notes"),
    };

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "保存に失敗しました");
      }
      router.push(`/reports/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="form-row">
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="title">報告書タイトル *</label>
          <input id="title" name="title" required placeholder="例: 営業部 月次報告書" />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="year">対象年 *</label>
          <input
            id="year"
            name="year"
            type="number"
            required
            defaultValue={now.getFullYear()}
            min={2000}
            max={2100}
          />
        </div>
        <div className="field">
          <label htmlFor="month">対象月 *</label>
          <select id="month" name="month" required defaultValue={now.getMonth() + 1}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="author">作成者 *</label>
          <input id="author" name="author" required placeholder="山田 太郎" />
        </div>
        <div className="field">
          <label htmlFor="department">部署</label>
          <input id="department" name="department" placeholder="営業部" />
        </div>
      </div>

      <div className="section-title">報告内容</div>

      <div className="field">
        <label htmlFor="summary">
          概要 <span className="hint">(全体サマリー)</span>
        </label>
        <textarea id="summary" name="summary" placeholder="今月の全体的な概要を記入してください" />
      </div>

      <div className="field">
        <label htmlFor="achievements">今月の実績</label>
        <textarea
          id="achievements"
          name="achievements"
          placeholder="達成した目標、完了したタスクなどを記入してください"
        />
      </div>

      <div className="field">
        <label htmlFor="issues">課題・問題点</label>
        <textarea id="issues" name="issues" placeholder="発生した課題や問題点を記入してください" />
      </div>

      <div className="field">
        <label htmlFor="nextPlan">来月の予定</label>
        <textarea id="nextPlan" name="nextPlan" placeholder="来月の計画や目標を記入してください" />
      </div>

      <div className="field">
        <label htmlFor="notes">その他・備考</label>
        <textarea id="notes" name="notes" placeholder="その他共有事項があれば記入してください" />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
          キャンセル
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}
