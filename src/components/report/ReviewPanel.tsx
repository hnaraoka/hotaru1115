"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewStatusLabel } from "@/lib/format";

export function ReviewPanel({
  reportId,
  initialStatus,
  initialComment,
  reviewedAt,
  reviewedByName,
  flags,
}: {
  reportId: string;
  initialStatus: string;
  initialComment: string | null;
  reviewedAt: string | null;
  reviewedByName: string | null;
  flags: string[];
}) {
  const router = useRouter();
  const [comment, setComment] = useState(initialComment ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(reviewStatus: "APPROVED" | "NEEDS_REVISION") {
    if (reviewStatus === "NEEDS_REVISION" && !comment.trim()) {
      setError("差し戻す場合は指摘内容を入力してください");
      return;
    }
    if (reviewStatus === "APPROVED" && !confirm("この報告書を承認しますか？")) return;

    setPending(true);
    setError(null);
    const res = await fetch(`/api/reports/${reportId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus, reviewComment: comment }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "更新に失敗しました");
      return;
    }
    router.refresh();
  }

  return (
    <div className="detail-section">
      <h2>レビュー（管理者用）</h2>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>
        現在のレビュー状況: <strong>{reviewStatusLabel(initialStatus)}</strong>
        {reviewedByName &&
          reviewedAt &&
          `（${reviewedByName} / ${new Date(reviewedAt).toLocaleString("ja-JP")}）`}
      </p>

      {flags.length > 0 && (
        <div className="reminder-banner" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
          <strong style={{ fontSize: 13 }}>自動チェック（{flags.length}件、参考情報です）</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13 }}>
            {flags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="reviewComment">指摘内容（差し戻す場合は必須。本人にメールで送信されます）</label>
        <textarea
          id="reviewComment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ minHeight: 90 }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={() => submit("APPROVED")} disabled={pending}>
          {pending ? "処理中..." : "承認する"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => submit("NEEDS_REVISION")} disabled={pending}>
          {pending ? "処理中..." : "差し戻す"}
        </button>
      </div>
      {error && (
        <div className="error-banner" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
}
