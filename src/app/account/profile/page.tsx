import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WORK_TYPE_OPTIONS } from "@/lib/constants";
import { EngineerStartForm } from "@/components/account/EngineerStartForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, loginId: true, workType: true, engineerStartYear: true, engineerStartMonth: true },
  });
  if (!user) redirect("/login");

  const workTypeLabel = WORK_TYPE_OPTIONS.find((o) => o.value === user.workType)?.label ?? user.workType;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>プロフィール</h1>
        </div>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2>基本情報</h2>
        <div className="form">
          <div className="field">
            <label>氏名</label>
            <p>{user.name}</p>
          </div>
          <div className="field">
            <label>ログインID</label>
            <p>{user.loginId}</p>
          </div>
          <div className="field">
            <label>業務区分</label>
            <p>{workTypeLabel}</p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>エンジニア開始年月</h2>
        <EngineerStartForm initialYear={user.engineerStartYear} initialMonth={user.engineerStartMonth} />
      </section>

      <section>
        <h2>パスワード変更</h2>
        <ChangePasswordForm />
      </section>
    </>
  );
}
