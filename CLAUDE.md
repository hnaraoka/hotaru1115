@AGENTS.md

# 本番デプロイ手順

ユーザー（どのセッションであっても）から「本番にデプロイして」「本番にあげて」など本番反映を指示されたら、以下の手順を実行する。

1. 本番ブランチ `claude/vercel-nodejs-monthly-report-smtys4`（このリポジトリのデフォルトブランチ。Vercelプロジェクト `monthly-report` の本番環境に連動している）の最新を取得する。
2. 反映したい作業ブランチ（現在作業中のブランチ、またはユーザーが指定したブランチ）を本番ブランチにマージする。fast-forwardできる場合はfast-forwardで、コンフリクトがあれば内容を確認し解決してからマージする。
3. `git push origin claude/vercel-nodejs-monthly-report-smtys4` で本番ブランチに反映する。

これによりVercelのGitHub連携が自動的にプッシュを検知し、Production環境への自動デプロイが開始される（PRの作成やVercel側の追加操作は不要）。

- 本番URL: https://monthly-report-1.vercel.app
- Vercelダッシュボード（デプロイ状況確認用）: https://vercel.com/pj1101/monthly-report/deployments

本番ブランチへの直接マージは影響が大きいため、対象ブランチの内容に不明点がある場合や、マージがfast-forwardでできず本番ブランチと衝突する変更がある場合は、実行前にユーザーに確認する。
