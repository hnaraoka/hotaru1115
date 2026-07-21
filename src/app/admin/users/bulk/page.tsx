import { BulkUserForm } from "@/components/admin/BulkUserForm";
import { requireAdminPageSession } from "@/lib/requireAdminPage";

export const dynamic = "force-dynamic";

export default async function BulkUserPage() {
  await requireAdminPageSession();

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
