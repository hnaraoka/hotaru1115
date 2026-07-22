# 保留中の運用作業

## 本番マイグレーション適用待ち：パスワード変更時のセッション無効化

- 対象コミット: `dea544b`（ブランチ `claude/monthly-report-pdf-excel-import-t5fq7x`）
- 内容: パスワードを変更・再発行した際に、既にログイン済みの古いセッションを無効化するための修正。`User` テーブルに `passwordChangedAt` カラムを追加するマイグレーション（`prisma/migrations/20260721235114_add_password_changed_at/`）を含む。
- **本番ブランチ (`claude/vercel-nodejs-monthly-report-smtys4`) へはまだマージ・デプロイしていない。**

このリポジトリはVercelのビルド時にマイグレーションを自動実行しない（`npm run build` は `prisma generate && next build` のみ）。マイグレーションは本番DBに対して手動で `npx prisma migrate deploy` を実行する運用のため、ユーザー自身の作業が必要。

### ユーザーがやるべきこと

1. Vercelダッシュボード → 対象プロジェクト → Settings → Environment Variables から本番の `DATABASE_URL` を確認する
2. ローカルでこのリポジトリの `claude/monthly-report-pdf-excel-import-t5fq7x` ブランチを取得し、以下を実行する（`.env`は書き換えず、環境変数として一時的に指定する）
   ```bash
   DATABASE_URL="<本番のDATABASE_URL>" npx prisma migrate deploy
   ```
   適用対象は上記マイグレーション1件のみ。単純な `ALTER TABLE "User" ADD COLUMN "passwordChangedAt" ... DEFAULT CURRENT_TIMESTAMP` で、既存データの削除・変換はない。
3. 適用が完了したら、Claudeに伝えて本番ブランチへのマージ・プッシュ（＝コードのデプロイ）を依頼する

### 順序が重要

**①マイグレーション適用 → ②コードを本番デプロイ** の順を必ず守ること。逆順（先にコードだけデプロイ）すると、本番DBにカラムが無い状態でPrismaがそれを参照しようとし、ログインが全面的に失敗する。

### 補足

マイグレーション適用後、既存ユーザー全員の `passwordChangedAt` にはマイグレーション実行時刻が入る。今回の修正が本番デプロイされて反映されると、「セッション発行時刻 < passwordChangedAt」となる現在ログイン中の全ユーザーは、次の再チェック（最大5分以内）で一度だけ再ログインを求められる。実害はないが、事前に周知しておくと親切。

---

この作業が完了したら、このファイルは削除してよい。
