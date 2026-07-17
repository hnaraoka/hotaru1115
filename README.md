# 月次報告書作成アプリ

Next.js (Node.js) + Prisma + PostgreSQL で構築した、SES常駐エンジニア向け月次報告書の作成・保存・一覧表示・PDF出力ができるアプリです。Vercel へのデプロイを想定しています。

## 開発状況

現在 **Phase 2（月次報告書フォーム）** まで実装済みです。

- [x] Phase 1: データモデル刷新＋認証基盤（NextAuth・ユーザー管理画面・ログイン画面・失敗回数通知）
- [x] Phase 2: 月次報告書フォーム＋バリデーション＋保存
- [ ] Phase 3: PDF出力（レイアウト再現・円グラフ含む）
- [ ] Phase 4: 前月データ引き継ぎ
- [ ] Phase 5: Resendメール通知＋画面内通知の仕上げ
- [ ] Phase 6: 過去PDF読み込み（固定テンプレート解析）
- [ ] Phase 7: モバイル最適化・全体QA

## Phase 1 で実装した機能

- **管理者によるユーザー管理**: ログインID・氏名・権限（管理者/一般）を指定してアカウントを作成すると、初期パスワードが自動発行され画面に表示されます（管理者が口頭で伝達）。編集画面から権限変更・パスワード再発行・アカウント無効化ができます。
- **ログイン画面**: ログインID・パスワードでログイン。3回連続で失敗すると、管理画面の通知一覧に記録され、管理者アカウントにメール通知（Resend、未設定時は画面内通知のみ）が送信されます。
- **権限制御**: `/admin/**` は管理者のみアクセス可能。未ログインのアクセスは自動的に `/login` へリダイレクトされます。

## Phase 2 で実装した機能

- **月次報告書フォーム**: 提出日・対象年月・参画先企業・作業場所・月間実労働・技術スタック（言語/FW/DB/ツール/OS・タグ入力）・プロジェクト期間・作業内容・開発工程（チェックボックス）・成果物・所感・自己評価（5段階×6項目）・作業配分（自由項目＋割合）を入力できます。
- **バリデーション**: 必須項目・開発工程1つ以上選択・作業配分の合計100%チェックをクライアント側（Zod）とサーバー側APIの両方で実施します。同一ユーザー・同一対象月の重複作成はサーバー側で防止されます。
- **一覧・詳細・編集・削除**: ログインユーザー本人の報告書のみ閲覧・編集・削除できます（管理者は全件アクセス可）。

## 技術構成

- [Next.js](https://nextjs.org)（App Router / TypeScript）
- [Prisma](https://www.prisma.io) + PostgreSQL（データの保存）
- [NextAuth (Auth.js) v5](https://authjs.dev) + bcryptjs（ID/パスワード認証）
- [Resend](https://resend.com)（ログイン失敗の管理者宛メール通知。未設定時は画面内通知のみ動作）
- [@react-pdf/renderer](https://react-pdf.org)（Phase 3で使用予定。Noto Sans JP の常用漢字サブセットフォントを同梱）

## セットアップ（ローカル開発）

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の準備

```bash
cp .env.example .env
```

- `DATABASE_URL`: PostgreSQL の接続文字列
- `AUTH_SECRET`: `openssl rand -base64 32` などで生成したランダム文字列
- `AUTH_TRUST_HOST`: ローカル開発や Vercel 以外の環境では `true` を設定
- `RESEND_API_KEY` / `NOTIFY_FROM_EMAIL`: 管理者へのメール通知を使う場合に設定（未設定でも動作します）

### 3. マイグレーションの適用

```bash
npx prisma migrate dev
```

### 4. 初期管理者アカウントの作成

```bash
npm run db:seed
```

デフォルトでは ログインID: `admin` / パスワード: `ChangeMe123!` が作成されます。`SEED_ADMIN_LOGIN_ID` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` / `SEED_ADMIN_EMAIL` 環境変数で上書きできます。ログイン後は管理画面からパスワードを再発行してください。

### 5. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いてください。

## Vercel へのデプロイ

1. このリポジトリを Vercel にインポートします。
2. **Storage** タブから Vercel Postgres（または任意の PostgreSQL、例: Neon / Supabase）を作成し、プロジェクトに接続します。接続すると `DATABASE_URL` 環境変数が自動的に設定されます（自動設定されない場合は Project Settings > Environment Variables で手動設定してください）。
3. `AUTH_SECRET` を Project Settings > Environment Variables に設定します。
4. （任意）管理者へのメール通知を使う場合は `RESEND_API_KEY` / `NOTIFY_FROM_EMAIL` を設定します。
5. 初回デプロイ前後に、マイグレーションと初期管理者アカウント作成を実行します（`DATABASE_URL` をデプロイ先のデータベースに向けた状態で実行してください）。

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

6. デプロイを実行します。`npm run build` は自動的に `prisma generate` を実行してから `next build` を行います（`postinstall` でも `prisma generate` を実行するため、Vercel のキャッシュ環境でも Prisma Client が生成されます）。

## PDFの日本語フォントについて（Phase 3で使用予定）

`src/fonts/` に Noto Sans JP（OFL ライセンス）を常用漢字・ひらがな・カタカナ・記号に絞ってサブセット化したフォントを同梱しています。より広い文字をカバーしたい場合は `src/fonts/` のフォントをフルセットのものに差し替えてください（ファイルサイズが増加します）。

## ディレクトリ構成（抜粋）

```
src/
  app/
    login/                        ログイン画面
    admin/                        管理者ダッシュボード・ユーザー管理画面
    api/auth/[...nextauth]/       NextAuth ハンドラー
    api/admin/users/              ユーザーCRUD API
    api/admin/notifications/      通知既読API
  components/
    admin/                        ユーザー管理・通知のUI部品
    LogoutButton.tsx
  lib/
    prisma.ts                     Prisma Client シングルトン
    auth.ts                       NextAuth設定（Credentials Provider）
    notify.ts                     ログイン失敗時の通知処理
    password.ts                   初期パスワード生成・ハッシュ化
    requireAdmin.ts               管理者権限チェック
  proxy.ts                        ルート保護（旧middleware。Next.js 16でリネーム）
  fonts/                          PDF用日本語フォント（Phase 3で使用）
prisma/
  schema.prisma                   データモデル定義
  seed.ts                         初期管理者アカウント作成スクリプト
```
