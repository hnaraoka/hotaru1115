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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      role: formData.get("role"),
      email: formData.get("email"),
      isActive: formData.get("isActive") === "on",
    };

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

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetPassword}
            disabled={submitting}
          >
            パスワードを再発行
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
