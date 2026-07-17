import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>月次報告書一覧</h1>
          <p>ようこそ、{user?.name} さん。</p>
        </div>
      </div>
      <div className="empty-state">
        <p>月次報告書の作成・一覧機能は準備中です。</p>
        <p>まもなく公開予定です。</p>
      </div>
    </>
  );
}
