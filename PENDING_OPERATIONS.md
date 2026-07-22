# 保留中の運用作業

## 本番マイグレーション適用待ち

以下の2件のマイグレーションが本番DBに未適用（**本番ブランチ `claude/vercel-nodejs-monthly-report-smtys4` へはまだマージ・デプロイしていない**）。

1. `prisma/migrations/20260721235114_add_password_changed_at/` — パスワード変更・再発行時に既存セッションを無効化するための `User.passwordChangedAt`
2. `prisma/migrations/20260722025300_add_birth_date_and_engineer_start/` — 月次報告書の年齢・経験年数を自動計算するための `User.birthDate` / `User.engineerStartYear` / `User.engineerStartMonth`

`npx prisma migrate deploy` は未適用のマイグレーションを古い順にまとめて適用するので、**1回の実行で両方とも反映される**。

このリポジトリはVercelのビルド時にマイグレーションを自動実行しない（`npm run build` は `prisma generate && next build` のみ）。マイグレーションは本番DBに対して手動で `npx prisma migrate deploy` を実行する運用のため、ユーザー自身の作業が必要。

### ユーザーがやるべきこと

1. Vercelダッシュボード → 対象プロジェクト → Settings → Environment Variables から本番の `DATABASE_URL` を確認する
2. ローカルでこのリポジトリの `claude/monthly-report-pdf-excel-import-t5fq7x` ブランチを取得し、以下を実行する（`.env`は書き換えず、環境変数として一時的に指定する）
   ```bash
   DATABASE_URL="<本番のDATABASE_URL>" npx prisma migrate deploy
   ```
   いずれも既存データの削除・変換を伴わない単純なカラム追加（`ADD COLUMN`）のみ。
3. 適用が完了したら、Claudeに伝えて本番ブランチへのマージ・プッシュ（＝コードのデプロイ）を依頼する

### 順序が重要

**①マイグレーション適用 → ②コードを本番デプロイ** の順を必ず守ること。逆順（先にコードだけデプロイ）すると、本番DBにカラムが無い状態でPrismaがそれを参照しようとし、ログインが全面的に失敗する。

### 補足

- マイグレーション1（passwordChangedAt）適用後、本番デプロイが反映されると、現在ログイン中の全ユーザーは次の再チェック（最大5分以内）で一度だけ再ログインを求められる。実害はないが、事前に周知しておくと親切。
- マイグレーション2（birthDate等）は既存ユーザー全員 `NULL` から始まる。年齢・経験年数の自動計算を使うには、管理者がユーザー編集画面（`/admin/users/[id]`）で生年月日を設定する必要がある（任意項目、未設定でも他機能に支障はない）。エンジニア開始年月は各ユーザーが初回の月次報告書作成時に自分で入力する。

---

この作業が完了したら、このファイルは削除してよい。
