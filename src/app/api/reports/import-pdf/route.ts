import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/requireUser";
import { extractTextItems } from "@/lib/pdfImport/extractTextItems";
import { parseLegacyReport } from "@/lib/pdfImport/parseLegacyReport";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDFファイルを選択してください" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "PDFファイルのみアップロードできます" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "ファイルサイズが大きすぎます（10MBまで）" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const items = await extractTextItems(buffer);
    const parsed = parseLegacyReport(items);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("PDF読み込みに失敗しました", error);
    return NextResponse.json(
      {
        error: "PDFの読み込みに失敗しました。対応していない形式の可能性があります。",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 422 },
    );
  }
}
