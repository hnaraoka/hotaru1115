"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DriveUploadStatus({
  reportId,
  driveUploadedAt,
  driveUploadError,
  driveFileUrl,
}: {
  reportId: string;
  driveUploadedAt: string | null;
  driveUploadError: string | null;
  driveFileUrl: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/reports/${reportId}/drive-upload`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "送信に失敗しました");
      return;
    }
    router.refresh();
  }

  return (
    <div className="detail-section">
      <h2>LINE WORKS Driveへの自動格納</h2>

      {driveUploadedAt && (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          格納済み（{new Date(driveUploadedAt).toLocaleString("ja-JP")}）
          {driveFileUrl && (
            <>
              {" ／ "}
              <a href={driveFileUrl} target="_blank" rel="noopener noreferrer">
                LINE WORKS Driveで開く
              </a>
            </>
          )}
        </p>
      )}

      {driveUploadError && (
        <div className="error-banner" style={{ marginBottom: 10 }}>
          直近の自動格納に失敗しました: {driveUploadError}
        </div>
      )}

      {!driveUploadedAt && !driveUploadError && (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>まだ格納されていません。</p>
      )}

      <button type="button" className="btn btn-secondary" onClick={retry} disabled={pending}>
        {pending ? "送信中..." : "LINE WORKS Driveへ再送信"}
      </button>
      {error && (
        <div className="error-banner" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
}
