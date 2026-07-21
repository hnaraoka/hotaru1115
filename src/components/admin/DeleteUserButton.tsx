"use client";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export function DeleteUserButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmDeleteButton
      confirmMessage={`${name} さんのアカウントを削除しますか？この操作は取り消せません。作成済みの月次報告書もすべて削除されます。`}
      deleteUrl={`/api/admin/users/${id}`}
      redirectTo="/admin/users"
      label="このユーザーを削除"
    />
  );
}
