"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserData = {
  id: string;
  loginId: string;
  name: string;
  role: "ADMIN" | "USER";
  email: string | null;
  isActive: boolean;
};

export function EditUserForm({ user }: { user: UserData }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setPasswordChanged(false);

    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

    if (password !== "") {
      if (password.length < 8) {
        setError("パスワードは8文字以上で入力してください");
        return;
      }
      if (password !== passwordConfirm) {
        setError("パスワードと確認用パスワードが一致しません");
        return;
      }
    }

    setSubmitting(true);

    const payload: Record<string, unknown> = {
      name: formData.get("name"),
      role: formData.get("role"),
      email: formData.get("email"),
      isActive: formData.get("isActive") === "on",
    };
    if (password !== "") payload.password = password;

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "更新に失敗しました");
      setSubmitting(false);
      return;
    }

    if (password !== "") {
      setSubmitting(false);
      setPasswordChanged(true);
      form.reset();
      router.refresh();
      return;
    }

    setSubmitting(false);
    router.push("/admin/users");
    router.refresh();
  }

  async function handleResetPassword() {
    if (!confirm(`${user.name} さんのパスワードを再発行しますか？`)) return;
    setSubmitting(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "再発行に失敗しました");
      return;
    }
    setResetPasswordResult(data.newPassword);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {resetPasswordResult && (
        <div className="detail-meta">
          <div className="detail-meta-item">
            <div className="label">新しい初期パスワード（今だけ表示）</div>
            <div className="value">{resetPasswordResult}</div>
          </div>
        </div>
      )}

      {passwordChanged && (
        <div className="carry-over-done">パスワードを変更しました。</div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>ログインID</label>
          <input value={user.loginId} disabled />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="name">氏名 *</label>
            <input id="name" name="name" defaultValue={user.name} required />
          </div>
          <div className="field">
            <label htmlFor="role">権限 *</label>
            <select id="role" name="role" defaultValue={user.role} required>
              <option value="USER">一般</option>
              <option value="ADMIN">管理者</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="email">メールアドレス</label>
          <input id="email" name="email" type="email" defaultValue={user.email ?? ""} />
        </div>

        <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input id="isActive" name="isActive" type="checkbox" defaultChecked={user.isActive} style={{ width: "auto" }} />
          <label htmlFor="isActive" style={{ marginBottom: 0 }}>
            アカウントを有効にする
          </label>
        </div>

        <div className="section-title">パスワードを変更する</div>
        <p className="hint" style={{ margin: 0 }}>
          自分でパスワードを指定したい場合は入力してください。空欄のままなら変更されません。
        </p>
        <div className="form-row">
          <div className="field">
            <label htmlFor="password">新しいパスワード</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} />
            <span className="hint">8文字以上</span>
          </div>
          <div className="field">
            <label htmlFor="passwordConfirm">新しいパスワード（確認用）</label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetPassword}
            disabled={submitting}
          >
            ランダムなパスワードを再発行
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
