import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "月次報告書作成アプリ",
  description: "月次報告書を作成・保存・PDF出力できるアプリです",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              📋 月次報告書作成アプリ
            </Link>
            <nav className="nav">
              <Link href="/">一覧</Link>
              <Link href="/new" className="nav-cta">
                ＋ 新規作成
              </Link>
            </nav>
          </div>
        </header>
        <main className="main">{children}</main>
        <footer className="site-footer">Monthly Report App</footer>
      </body>
    </html>
  );
}
