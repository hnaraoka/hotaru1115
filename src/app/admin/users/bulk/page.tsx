import { BulkUserForm } from "@/components/admin/BulkUserForm";

export default function BulkUserPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>ユーザーの一括登録</h1>
          <p>CSVファイルから複数のユーザーをまとめて作成します。</p>
        </div>
      </div>
      <BulkUserForm />
    </>
  );
}
