import crypto from "node:crypto";

// LINE WORKS Driveへの自動格納クライアント。
//
// 認証はサービスアカウント(JWT Bearer)方式（LINE WORKS API 2.0、
// https://developers.worksmobile.com/jp/docs/auth-jwt ）を前提にしている。
// アップロード自体はマイドライブへの「①アップロードURLを発行 → ②発行されたURLへ
// ファイル本体を送信」という2段階APIを前提に実装しているが、開発環境から
// developers.worksmobile.com への外部アクセスが制限されており、実際のリクエスト/
// レスポンス形式（フィールド名・エンドポイントパス）を公式ドキュメントで最終確認
// できていない。本番投入前に実際の認証情報で一度実行し、失敗した場合はエラー
// メッセージ（LINE WORKS APIが返すレスポンス本文をそのまま含めている）を元に
// このファイルのエンドポイント/フィールド名を公式ドキュメントと突き合わせて
// 調整すること。

const TOKEN_URL = "https://auth.worksmobile.com/oauth2/v2.0/token";
const API_BASE = "https://www.worksapis.com/v1.0";

type LineWorksConfig = {
  clientId: string;
  clientSecret: string;
  serviceAccount: string;
  privateKey: string;
  driveUserId: string;
  folderId?: string;
};

function loadConfig(): LineWorksConfig | null {
  const clientId = process.env.LINEWORKS_CLIENT_ID;
  const clientSecret = process.env.LINEWORKS_CLIENT_SECRET;
  const serviceAccount = process.env.LINEWORKS_SERVICE_ACCOUNT;
  const privateKey = process.env.LINEWORKS_PRIVATE_KEY;
  const driveUserId = process.env.LINEWORKS_DRIVE_USER_ID;
  if (!clientId || !clientSecret || !serviceAccount || !privateKey || !driveUserId) return null;

  return {
    clientId,
    clientSecret,
    serviceAccount,
    // Vercel等の環境変数では改行を \n として渡すことが多いため復元する。
    privateKey: privateKey.includes("\\n") ? privateKey.replace(/\\n/g, "\n") : privateKey,
    driveUserId,
    folderId: process.env.LINEWORKS_DRIVE_FOLDER_ID || undefined,
  };
}

export function isLineWorksDriveConfigured(): boolean {
  return loadConfig() !== null;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildServiceAccountAssertion(config: LineWorksConfig): string {
  const header = { alg: "RS256", typ: "JWT" };
  const nowSeconds = Math.floor(Date.now() / 1000);
  // iss/subの意味やexp-iatの上限(3600秒)はLINE WORKS API 2.0のJWT Bearer仕様に準拠。
  const payload = {
    iss: config.clientId,
    sub: config.serviceAccount,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = base64url(signer.sign(config.privateKey));
  return `${unsigned}.${signature}`;
}

async function fetchAccessToken(config: LineWorksConfig): Promise<string> {
  const assertion = buildServiceAccountAssertion(config);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "drive",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LINE WORKSアクセストークンの取得に失敗しました (HTTP ${res.status}): ${text}`);
  }

  const data = (await res.json().catch(() => ({}))) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("LINE WORKSアクセストークンの取得に失敗しました（レスポンスにaccess_tokenが含まれていません）");
  }
  return data.access_token;
}

export type LineWorksUploadResult = {
  fileId: string;
  fileUrl: string | null;
};

export async function uploadPdfToLineWorksDrive(fileName: string, pdfBuffer: Buffer): Promise<LineWorksUploadResult> {
  const config = loadConfig();
  if (!config) {
    throw new Error(
      "LINE WORKS連携が未設定です（LINEWORKS_CLIENT_ID / LINEWORKS_CLIENT_SECRET / LINEWORKS_SERVICE_ACCOUNT / LINEWORKS_PRIVATE_KEY / LINEWORKS_DRIVE_USER_ID を設定してください）",
    );
  }

  const accessToken = await fetchAccessToken(config);

  const createRes = await fetch(`${API_BASE}/users/${encodeURIComponent(config.driveUserId)}/drive/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      ...(config.folderId ? { parentFolderId: config.folderId } : {}),
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text().catch(() => "");
    throw new Error(`LINE WORKS DriveのアップロードURL発行に失敗しました (HTTP ${createRes.status}): ${text}`);
  }

  const created = (await createRes.json().catch(() => ({}))) as Record<string, unknown>;
  const uploadUrl = typeof created.uploadUrl === "string" ? created.uploadUrl : undefined;
  const fileId = typeof created.fileId === "string" ? created.fileId : undefined;
  if (!uploadUrl || !fileId) {
    throw new Error(`LINE WORKS DriveのアップロードURL/ファイルIDを取得できませんでした: ${JSON.stringify(created)}`);
  }

  const formData = new FormData();
  formData.append("Filedata", new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }), fileName);

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => "");
    throw new Error(`LINE WORKS Driveへのファイル送信に失敗しました (HTTP ${uploadRes.status}): ${text}`);
  }

  const uploadedInfo = (await uploadRes.json().catch(() => ({}))) as Record<string, unknown>;
  const fileUrl =
    (typeof created.fileUrl === "string" && created.fileUrl) ||
    (typeof created.url === "string" && created.url) ||
    (typeof uploadedInfo.fileUrl === "string" && uploadedInfo.fileUrl) ||
    (typeof uploadedInfo.url === "string" && uploadedInfo.url) ||
    null;

  return { fileId, fileUrl };
}
