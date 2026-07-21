"use client";

import { useState } from "react";
import Link from "next/link";
import { parseCsv, toCsv } from "@/lib/csv";
import { SimpleTable } from "@/components/SimpleTable";

type PreviewRow = { loginId: string; name: string; role: "ADMIN" | "USER"; email: string | null };
type ResultRow = PreviewRow & { success: boolean; initialPassword?: string; error?: string };

const ROLE_LABEL: Record<"ADMIN" | "USER", string> = { ADMIN: "管理者", USER: "一般" };

function parseRole(value: string): "ADMIN" | "USER" {
  const trimmed = value.trim();
  return trimmed === "管理者" || trimmed.toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
}

function looksLikeHeader(row: string[]): boolean {
  const first = (row[0] ?? "").trim().toLowerCase();
  return first === "ログインid" || first === "loginid";
}

const TEMPLATE_CSV = toCsv([
  ["ログインID", "氏名", "権限", "メールアドレス"],
  ["yamada.taro", "山田 太郎", "一般", ""],
  ["sato.hanako", "佐藤 花子", "管理者", "sato@example.com"],
]);

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkUserForm() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFile(file: File) {
    setFileName(file.name);
    setResults(null);
    setSubmitError(null);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      let rows = parseCsv(text);
      if (rows.length > 0 && looksLikeHeader(rows[0])) rows = rows.slice(1);

      const parsed: PreviewRow[] = rows
        .filter((r) => r.some((cell) => cell.trim() !== ""))
        .map((r) => ({
          loginId: (r[0] ?? "").trim(),
          name: (r[1] ?? "").trim(),
          role: parseRole(r[2] ?? ""),
          email: (r[3] ?? "").trim() || null,
        }));

      if (parsed.length === 0) {
        setParseError("CSVから登録可能な行を読み取れませんでした");
        setPreview([]);
        return;
      }
      setPreview(parsed);
    };
    reader.onerror = () => setParseError("ファイルの読み込みに失敗しました");
    reader.readAsText(file, "utf-8");
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch("/api/admin/users/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: preview }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setSubmitError(data.error ?? "登録に失敗しました");
      return;
    }
    setResults(data.results);
    setPreview([]);
  }

  function handleDownloadResults() {
    if (!results) return;
    const rows = [
      ["ログインID", "氏名", "権限", "初期パスワード", "結果"],
      ...results.map((r) => [
        r.loginId,
        r.name,
        ROLE_LABEL[r.role],
        r.success ? (r.initialPassword ?? "") : "",
        r.success ? "作成成功" : `作成失敗: ${r.error ?? ""}`,
      ]),
    ];
    downloadCsv("ユーザー一括登録結果.csv", toCsv(rows));
  }

  if (results) {
    const successCount = results.filter((r) => r.success).length;
    return (
      <div className="form" style={{ gap: 16 }}>
        <p>
          {results.length}件中 <strong>{successCount}件成功</strong> / {results.length - successCount}件失敗
        </p>
        <SimpleTable
          columns={["ログインID", "氏名", "権限", "初期パスワード", "結果"]}
          rows={results.map((r, i) => ({
            key: i,
            cells: [
              r.loginId,
              r.name,
              ROLE_LABEL[r.role],
              r.success ? r.initialPassword : "-",
              <span key="result" style={{ color: r.success ? "var(--success)" : "var(--danger)" }}>
                {r.success ? "成功" : `失敗: ${r.error}`}
              </span>,
            ],
          }))}
        />
        <p className="hint">
          初期パスワードはこの画面を離れると再表示できません。CSVでダウンロードするか、各ユーザーへ安全な方法で伝達してください。
        </p>
        <div className="form-actions">
          <Link href="/admin/users" className="btn btn-secondary">
            ユーザー一覧に戻る
          </Link>
          {successCount > 0 && (
            <button type="button" className="btn btn-primary" onClick={handleDownloadResults}>
              結果をCSVダウンロード
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="form" style={{ gap: 16 }}>
      <p className="hint" style={{ margin: 0 }}>
        1行目はヘッダーとして扱われます。列の順番は「ログインID, 氏名, 権限(管理者/一般), メールアドレス(任意)」です。
      </p>
      <div className="form-actions" style={{ justifyContent: "flex-start" }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => downloadCsv("ユーザー登録テンプレート.csv", TEMPLATE_CSV)}
        >
          テンプレートCSVをダウンロード
        </button>
      </div>

      <div className="field">
        <label htmlFor="csvFile">CSVファイル</label>
        <input
          id="csvFile"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fileName && <span className="hint">選択中: {fileName}</span>}
      </div>

      {parseError && <div className="error-banner">{parseError}</div>}
      {submitError && <div className="error-banner">{submitError}</div>}

      {preview.length > 0 && (
        <>
          <SimpleTable
            columns={["ログインID", "氏名", "権限", "メールアドレス"]}
            rows={preview.map((row, i) => ({
              key: i,
              cells: [
                row.loginId || <em key="loginId">未入力</em>,
                row.name || <em key="name">未入力</em>,
                ROLE_LABEL[row.role],
                row.email ?? "",
              ],
            }))}
          />
          <div className="form-actions">
            <Link href="/admin/users" className="btn btn-secondary">
              キャンセル
            </Link>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "作成中..." : `この${preview.length}件を作成する`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
