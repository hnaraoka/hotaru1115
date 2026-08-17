"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DriveFileMatchPanel({ targetYear, targetMonth }: { targetYear: number; targetMonth: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ matchedCount: number; matched: string[] } | null>(null);

  async function handleSubmit() {
    setPending(true);
    setError(null);
    setResult(null);
    const fileNames = text.split("\n");
    const res = await fetch("/api/admin/external-submissions/match-drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetYear, targetMonth, fileNames }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "照合に失敗しました");
      return;
    }
    const data = await res.json();
    setResult(data);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
        Driveのファイル名一覧から未提出者を照合
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }}>
      <p style={{ marginTop: 0, fontSize: 13, color: "var(--text-secondary)" }}>
        LINE WORKS Driveの「共有ドライブ/jioworks/10_月次報告書/{targetYear}
        年度/{`${targetYear}${String(targetMonth).padStart(2, "0")}`}」フォルダを開き、
        中のファイル名一覧を選択してコピーし、下に貼り付けてください（1行1ファイル名）。
        ファイル名に氏名が含まれるユーザーを自動で「確認済み（外部提出）」にします。
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={`例:\n6月度月次報告書_山田太郎.pdf\n2026年6月度月次報告書_佐藤花子.pdf`}
        style={{ width: "100%", fontFamily: "inherit", fontSize: 13 }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={pending || !text.trim()}>
          {pending ? "照合中..." : "照合して自動確認"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setOpen(false);
            setText("");
            setResult(null);
            setError(null);
          }}
        >
          閉じる
        </button>
      </div>
      {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{error}</p>}
      {result && (
        <p style={{ fontSize: 12, marginTop: 8 }}>
          {result.matchedCount}人を自動で確認済みにしました
          {result.matched.length > 0 ? `（${result.matched.join("、")}）` : ""}
        </p>
      )}
    </div>
  );
}
