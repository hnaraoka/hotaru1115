import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditUserForm } from "@/components/admin/EditUserForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: Props) {
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
        }}
      />
    </>
  );
}
