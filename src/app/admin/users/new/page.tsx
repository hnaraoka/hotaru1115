import { NewUserForm } from "@/components/admin/NewUserForm";

export const metadata = { title: "ユーザー追加 | 管理者設定" };

export default function NewUserPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>ユーザー追加</h1>
          <p>ログインIDと氏名を入力してください。初期パスワードは自動発行されます。</p>
        </div>
      </div>
      <NewUserForm />
    </>
  );
}
