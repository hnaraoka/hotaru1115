import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditUserForm } from "@/components/admin/EditUserForm";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { requireAdminPageSession } from "@/lib/requireAdminPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: Props) {
  await requireAdminPageSession();

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{user.name} さんの設定</h1>
          <p>権限の変更やパスワードの再発行ができます。</p>
        </div>
      </div>
      <EditUserForm
        user={{
          id: user.id,
          loginId: user.loginId,
          name: user.name,
          role: user.role,
          email: user.email,
          isActive: user.isActive,
          birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : "",
          engineerStartYear: user.engineerStartYear,
          engineerStartMonth: user.engineerStartMonth,
        }}
        emailConfigured={!!process.env.RESEND_API_KEY}
      />

      {user.role === "USER" && (
        <div className="card" style={{ padding: 20, marginTop: 14 }}>
          <div className="section-title" style={{ marginTop: 0, border: "none", padding: 0 }}>
            危険な操作
          </div>
          <p className="hint" style={{ margin: "6px 0 12px" }}>
            このユーザーのアカウントと、作成済みの月次報告書をすべて削除します。元に戻せません。
          </p>
          <DeleteUserButton id={user.id} name={user.name} />
        </div>
      )}
    </>
  );
}
