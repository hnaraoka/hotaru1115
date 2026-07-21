import { NewUserForm } from "@/components/admin/NewUserForm";
import { requireAdminPageSession } from "@/lib/requireAdminPage";

export const metadata = { title: "ユーザー追加 | 管理者設定" };
export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  await requireAdminPageSession();

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
