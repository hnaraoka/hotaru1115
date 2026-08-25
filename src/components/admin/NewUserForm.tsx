"use client";

import { useState } from "react";
import Link from "next/link";
import { WORK_TYPE_OPTIONS, GENDER_OPTIONS } from "@/lib/constants";

export function NewUserForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ loginId: string; name: string; initialPassword: string } | null>(
    null,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      loginId: formData.get("loginId"),
      name: formData.get("name"),
      role: formData.get("role"),
      email: formData.get("email"),
      birthDate: formData.get("birthDate") || null,
      workType: formData.get("workType"),
      gender: formData.get("gender") || null,
    };

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "作成に失敗しました");
      setSubmitting(false);
      return;
    }

    setCreated({ loginId: data.user.loginId, name: data.user.name, initialPassword: data.initialPassword });
    setSubmitting(false);
  }

  if (created) {
    return (
      <div className="form">
        <p>
          <strong>{created.name}</strong> さんのアカウントを作成しました。以下の情報を口頭などで安全にお伝えください（この初期パスワードは今だけ表示されます）。
        </p>
        <div className="detail-meta">
          <div className="detail-meta-item">
            <div className="label">ログインID</div>
            <div className="value">{created.loginId}</div>
          </div>
          <div className="detail-meta-item">
            <div className="label">初期パスワード</div>
            <div className="value">{created.initialPassword}</div>
          </div>
        </div>
        <div className="form-actions">
          <Link href="/admin/users" className="btn btn-primary">
            ユーザー一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="form-row">
        <div className="field">
          <label htmlFor="loginId">ログインID *</label>
          <input id="loginId" name="loginId" required placeholder="例: yamada.taro" />
        </div>
        <div className="field">
          <label htmlFor="name">氏名 *</label>
          <input id="name" name="name" required placeholder="山田 太郎" />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="role">権限 *</label>
          <select id="role" name="role" defaultValue="USER" required>
            <option value="USER">一般</option>
            <option value="ADMIN">管理者</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="email">
            メールアドレス <span className="hint">(管理者権限の場合、ログイン失敗通知の宛先になります)</span>
          </label>
          <input id="email" name="email" type="email" placeholder="user@example.com" />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="birthDate">
            生年月日 * <span className="hint">(月次報告書の年齢を自動計算するために使用します)</span>
          </label>
          <input id="birthDate" name="birthDate" type="date" required />
        </div>
        <div className="field">
          <label htmlFor="workType">業務 *</label>
          <select id="workType" name="workType" defaultValue="ENGINEER" required>
            {WORK_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="gender">
            性別 <span className="hint">(月次報告書の性別欄に自動反映されます)</span>
          </label>
          <select id="gender" name="gender" defaultValue="">
            <option value="">選択してください</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-actions">
        <Link href="/admin/users" className="btn btn-secondary">
          キャンセル
        </Link>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "作成中..." : "作成する（初期パスワードを発行）"}
        </button>
      </div>
    </form>
  );
}
