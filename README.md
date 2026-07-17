# 月次報告書作成アプリ

Next.js (Node.js) + Prisma + PostgreSQL で構築した、月次報告書の作成・保存・一覧表示・PDF出力ができるアプリです。Vercel へのデプロイを想定しています。

## 機能

- 汎用フォームで月次報告書を作成（タイトル / 対象年月 / 作成者 / 部署 / 概要 / 実績 / 課題 / 来月の予定 / 備考）
- 作成した報告書をデータベースに保存
- 一覧画面でこれまでの報告書を確認
- 詳細画面から日本語対応のPDFを出力・ダウンロード
- ログイン機能なし（社内ツール等での簡易利用を想定）

## 技術構成

- [Next.js](https://nextjs.org)（App Router / TypeScript）
- [Prisma](https://www.prisma.io) + PostgreSQL（データの保存）
- [@react-pdf/renderer](https://react-pdf.org)（サーバーサイドでのPDF生成。Noto Sans JP の常用漢字サブセットフォントを同梱し日本語を描画）

## セットアップ（ローカル開発）

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. データベースの準備

PostgreSQL データベースを用意し、`.env` に接続文字列を設定します。

```bash
cp .env.example .env
```

`.env` の `DATABASE_URL` を実際のデータベースに合わせて編集してください。

### 3. マイグレーションの適用

```bash
npx prisma migrate dev
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いてください。

## Vercel へのデプロイ

1. このリポジトリを Vercel にインポートします。
2. **Storage** タブから Vercel Postgres（または任意の PostgreSQL、例: Neon / Supabase）を作成し、プロジェクトに接続します。接続すると `DATABASE_URL` 環境変数が自動的に設定されます（自動設定されない場合は Project Settings > Environment Variables で手動設定してください）。
3. 初回デプロイ前後に、ローカルまたは Vercel のビルドフックからマイグレーションを適用します。

   ```bash
   npx prisma migrate deploy
   ```

   （`DATABASE_URL` をデプロイ先のデータベースに向けた状態で実行してください）

4. デプロイを実行します。`npm run build` は自動的に `prisma generate` を実行してから `next build` を行います（`postinstall` でも `prisma generate` を実行するため、Vercel のキャッシュ環境でも Prisma Client が生成されます）。

## PDFの日本語フォントについて

`src/fonts/` に Noto Sans JP（OFL ライセンス）を常用漢字・ひらがな・カタカナ・記号に絞ってサブセット化したフォントを同梱しています。任意の漢字（常用漢字外）を含む文章の場合、PDF上でその文字だけ表示されない可能性があります。より広い文字をカバーしたい場合は `src/fonts/` のフォントをフルセットのものに差し替えてください（ファイルサイズが増加します）。

## ディレクトリ構成（抜粋）

```
src/
  app/
    page.tsx                 一覧ページ
    new/page.tsx              新規作成ページ
    reports/[id]/page.tsx     詳細ページ
    api/reports/route.ts      一覧取得・新規作成API
    api/reports/[id]/route.ts        取得・削除API
    api/reports/[id]/pdf/route.ts    PDF生成API
  components/
    ReportForm.tsx            報告書入力フォーム
    DeleteReportButton.tsx    削除ボタン
  lib/
    prisma.ts                 Prisma Client シングルトン
    report.ts                 入力バリデーション
    pdf/ReportDocument.tsx    PDFレイアウト定義
  fonts/                       PDF用日本語フォント
prisma/
  schema.prisma                データモデル定義
```
