import { ReportForm } from "@/components/ReportForm";

export const metadata = {
  title: "新規作成 | 月次報告書作成アプリ",
};

export default function NewReportPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>月次報告書の新規作成</h1>
          <p>必要な項目を入力して保存すると、一覧・PDF出力ができます。</p>
        </div>
      </div>
      <ReportForm />
    </>
  );
}
