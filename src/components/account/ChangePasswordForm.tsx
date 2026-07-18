"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSuccess(false);

    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const newPasswordConfirm = String(formData.get("newPasswordConfirm") ?? "");

    if (newPassword.length < 8) {
      setError("新しいパスワードは8文字以上で入力してください");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError("新しいパスワードと確認用パスワードが一致しません");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "パスワードの変更に失敗しました");
      return;
    }

    setSuccess(true);
    form.reset();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {success && <div className="carry-over-done">パスワードを変更しました。</div>}

      <form className="form" onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="currentPassword">現在のパスワード *</label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="newPassword">新しいパスワード *</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <span className="hint">8文字以上</span>
        </div>

        <div className="field">
          <label htmlFor="newPasswordConfirm">新しいパスワード（確認用） *</label>
          <input
            id="newPasswordConfirm"
            name="newPasswordConfirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "変更中..." : "パスワードを変更する"}
          </button>
        </div>
      </form>
    </div>
  );
}
