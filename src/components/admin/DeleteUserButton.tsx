"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteUserButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `${name} さんのアカウントを削除しますか？この操作は取り消せません。作成済みの月次報告書もすべて削除されます。`
      )
    )
      return;
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/users");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "削除に失敗しました");
      setDeleting(false);
    }
  }

  return (
    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
      {deleting ? "削除中..." : "このユーザーを削除"}
    </button>
  );
}
