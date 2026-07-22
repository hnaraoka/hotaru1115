import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportForm } from "@/components/report/ReportForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditReportPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: { techStackItems: true, workAllocations: true },
  });

  if (!report) notFound();
  if (report.userId !== session.user.id && session.user.role !== "ADMIN") notFound();

  const owner = await prisma.user.findUnique({
    where: { id: report.userId },
    select: { birthDate: true, engineerStartYear: true, engineerStartMonth: true },
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>月次報告書の編集</h1>
          <p>
            {report.targetYear}年{report.targetMonth}月分の報告書を編集します。
          </p>
        </div>
      </div>
      <ReportForm
        report={report}
        birthDate={owner?.birthDate ?? null}
        engineerStartYear={owner?.engineerStartYear ?? null}
        engineerStartMonth={owner?.engineerStartMonth ?? null}
      />
    </>
  );
}
