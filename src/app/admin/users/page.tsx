import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPageSession } from "@/lib/requireAdminPage";
import { ExportUsersCsvButton } from "@/components/admin/ExportUsersCsvButton";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { ADMIN: "管理者", USER: "一般" };

export default async function AdminUsersPage() {
  await requireAdminPageSession();

  const users = await prisma.user.findMany({ orderBy: { loginId: "asc" } });

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>ユーザー管理</h1>
          <p>ログインID・パスワードの発行や権限の変更ができます。</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <ExportUsersCsvButton
            users={users.map((u) => ({
              loginId: u.loginId,
              name: u.name,
              birthDate: u.birthDate,
              workType: u.workType,
              email: u.email,
              role: u.role,
            }))}
          />
          <Link href="/admin/users/bulk" className="btn btn-secondary">
            CSVで一括登録
          </Link>
          <Link href="/admin/users/new" className="btn btn-primary">
            ＋ ユーザー追加
          </Link>
        </div>
      </div>

      <ul className="report-list">
        {users.map((u) => (
          <li key={u.id}>
            <Link href={`/admin/users/${u.id}`} className="report-item">
              <div className="report-item-top">
                <span className="report-item-title">
                  {u.name} {!u.isActive && <span style={{ color: "var(--danger)" }}>（無効）</span>}
                </span>
                <span className="report-item-period">{ROLE_LABEL[u.role]}</span>
              </div>
              <div className="report-item-meta">
                <span>ログインID: {u.loginId}</span>
                {u.email && <span>メール: {u.email}</span>}
                {u.failedLoginCount > 0 && (
                  <span style={{ color: "var(--danger)" }}>ログイン失敗: {u.failedLoginCount}回</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
