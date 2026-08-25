"use client";

import { useState } from "react";
import Link from "next/link";
import { parseCsv, toCsv, downloadCsv } from "@/lib/csv";
import { SimpleTable } from "@/components/SimpleTable";
import { CopyTextButton } from "@/components/admin/CopyTextButton";
import { WORK_TYPE_OPTIONS } from "@/lib/constants";
import { USER_CSV_HEADER } from "@/lib/adminUserCsv";

type PreviewRow = {
  loginId: string;
  name: string;
  role: "ADMIN" | "USER";
  email: string | null;
  birthDate: string | null;
  gender: string | null;
  workType: "ENGINEER" | "OFFICE";
};
type ResultRow = PreviewRow & {
  success: boolean;
  action: "created" | "updated";
  initialPassword?: string;
  error?: string;
};

const ROLE_LABEL: Record<"ADMIN" | "USER", string> = { ADMIN: "管理者", USER: "一般" };
const ACTION_LABEL: Record<"created" | "updated", string> = { created: "新規作成", updated: "更新" };
const WORK_TYPE_LABEL: Record<"ENGINEER" | "OFFICE", string> = Object.fromEntries(
  WORK_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<"ENGINEER" | "OFFICE", string>;

function parseRole(value: string): "ADMIN" | "USER" {
  const trimmed = value.trim();
  return trimmed === "管理者" || trimmed.toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
}

function parseWorkType(value: string): "ENGINEER" | "OFFICE" {
  const trimmed = value.trim();
  return trimmed === "内勤" || trimmed.toUpperCase() === "OFFICE" ? "OFFICE" : "ENGINEER";
}

function looksLikeHeader(row: string[]): boolean {
  const first = (row[0] ?? "").trim().toLowerCase();
  return first === "ログインid" || first === "loginid";
}

const TEMPLATE_CSV = toCsv([
  [...USER_CSV_HEADER],
  ["yamada.taro", "山田 太郎", "1990-05-10", "男性", "エンジニア", "", "一般"],
  ["sato.hanako", "佐藤 花子", "1985-11-02", "女性", "内勤", "sato@example.com", "管理者"],
]);

function accountCreatedMessage(r: ResultRow): string {
  return `${r.name}さん\nアカウントを登録しました。\n\nログインID: ${r.loginId}\n初期パスワード: ${r.initialPassword}\n\n次回ログイン後、必要であればパスワードを変更してください。`;
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
          birthDate: (r[2] ?? "").trim() || null,
          gender: (r[3] ?? "").trim() || null,
          workType: parseWorkType(r[4] ?? ""),
          email: (r[5] ?? "").trim() || null,
          role: parseRole(r[6] ?? ""),
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
      ["ログインID", "氏名", "権限", "処理", "初期パスワード", "結果"],
      ...results.map((r) => [
        r.loginId,
        r.name,
        ROLE_LABEL[r.role],
        ACTION_LABEL[r.action],
        r.success ? (r.initialPassword ?? "") : "",
        r.success ? "成功" : `失敗: ${r.error ?? ""}`,
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
          columns={["ログインID", "氏名", "権限", "処理", "初期パスワード", "結果", "連携"]}
          rows={results.map((r, i) => ({
            key: i,
            cells: [
              r.loginId,
              r.name,
              ROLE_LABEL[r.role],
              ACTION_LABEL[r.action],
              r.success ? r.initialPassword ?? "-" : "-",
              <span key="result" style={{ color: r.success ? "var(--success)" : "var(--danger)" }}>
                {r.success ? "成功" : `失敗: ${r.error}`}
              </span>,
              r.success && r.initialPassword ? (
                <CopyTextButton key="copy" label="LINE WORKS用の文面をコピー" text={accountCreatedMessage(r)} />
              ) : (
                "-"
              ),
            ],
          }))}
        />
        <p className="hint">
          新規作成分の初期パスワードはこの画面を離れると再表示できません。CSVでダウンロードするか、各ユーザーへ安全な方法で伝達してください(更新分はパスワードを変更していません)。
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
        1行目はヘッダーとして扱われます。列の順番は「ログインID,
        氏名, 生年月日(YYYY-MM-DD), 性別(任意), 業務(エンジニア/内勤), メールアドレス(任意), 権限(管理者/一般)」です。生年月日は必須で、月次報告書の年齢自動計算に使用されます。性別は月次報告書の性別欄に自動反映されます。業務が空欄・不正な値の場合は「エンジニア」として登録されます。ログインIDが既存ユーザーと一致する行は情報を更新し、一致しない行は新規作成します。
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
            columns={["ログインID", "氏名", "生年月日", "性別", "業務", "メールアドレス", "権限"]}
            rows={preview.map((row, i) => ({
              key: i,
              cells: [
                row.loginId || <em key="loginId">未入力</em>,
                row.name || <em key="name">未入力</em>,
                row.birthDate ?? <em key="birthDate">未入力</em>,
                row.gender ?? "",
                WORK_TYPE_LABEL[row.workType],
                row.email ?? "",
                ROLE_LABEL[row.role],
              ],
            }))}
          />
          <div className="form-actions">
            <Link href="/admin/users" className="btn btn-secondary">
              キャンセル
            </Link>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "登録中..." : `この${preview.length}件を登録する`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
