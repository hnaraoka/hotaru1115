"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { LOGIN_LOCKOUT_MINUTES } from "@/lib/authConstants";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      loginId,
      password,
      redirect: false,
    });

    if (result?.error) {
      if (result.code === "account-locked") {
        setError(
          `ログイン試行回数が上限に達したため、アカウントを一時的にロックしています。${LOGIN_LOCKOUT_MINUTES}分ほど時間をおいてから再度お試しください。お急ぎの場合は管理者にパスワードの再発行を依頼してください。`,
        );
      } else {
        setError("ログインIDまたはパスワードが正しくありません。");
      }
      setSubmitting(false);
      return;
    }

    window.location.assign(callbackUrl);
  }

  return (
    <form className="form" onSubmit={handleSubmit} style={{ maxWidth: 360, margin: "0 auto" }}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label htmlFor="loginId">ログインID</label>
        <input
          id="loginId"
          name="loginId"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="field">
        <label htmlFor="password">パスワード</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="form-actions" style={{ justifyContent: "stretch" }}>
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
          {submitting ? "ログイン中..." : "ログイン"}
        </button>
      </div>
    </form>
  );
}
