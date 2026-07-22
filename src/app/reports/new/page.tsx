import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportForm } from "@/components/report/ReportForm";
import { EngineerStartDateForm } from "@/components/report/EngineerStartDateForm";

export const metadata = { title: "新規作成 | 月次報告書作成アプリ" };
export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { birthDate: true, engineerStartYear: true, engineerStartMonth: true },
  });

  const needsEngineerStartDate = !user?.engineerStartYear || !user?.engineerStartMonth;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>月次報告書の新規作成</h1>
          <p>必要な項目を入力して保存してください。</p>
        </div>
      </div>
      {needsEngineerStartDate ? (
        <EngineerStartDateForm />
      ) : (
        <ReportForm
          birthDate={user?.birthDate ?? null}
          engineerStartYear={user!.engineerStartYear}
          engineerStartMonth={user!.engineerStartMonth}
        />
      )}
    </>
  );
}
