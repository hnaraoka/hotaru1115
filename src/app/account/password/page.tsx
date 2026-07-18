import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export default function AccountPasswordPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>パスワード変更</h1>
          <p>現在のパスワードを確認のうえ、新しいパスワードに変更できます。</p>
        </div>
      </div>
      <ChangePasswordForm />
    </>
  );
}
