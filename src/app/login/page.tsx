import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "ログイン | 月次報告書作成アプリ",
};

export default function LoginPage() {
  return (
    <>
      <div className="page-heading" style={{ justifyContent: "center", textAlign: "center" }}>
        <div>
          <h1>ログイン</h1>
          <p>発行されたログインIDとパスワードを入力してください。</p>
        </div>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
