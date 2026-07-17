import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "月次報告書作成アプリ",
  description: "月次報告書を作成・保存・PDF出力できるアプリです",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user;

  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              📋 月次報告書作成アプリ
            </Link>
            {user && (
              <nav className="nav">
                <Link href="/">一覧</Link>
                {user.role === "ADMIN" && <Link href="/admin/users">管理者設定</Link>}
                <span className="nav-user">{user.name} さん</span>
                <LogoutButton />
              </nav>
            )}
          </div>
        </header>
        <main className="main">{children}</main>
        <footer className="site-footer">Monthly Report App</footer>
      </body>
    </html>
  );
}
