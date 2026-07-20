import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/requireUser";
import { parseReportWorkbook } from "@/lib/excelImport/parseReportWorkbook";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream",
]);

export async function POST(request: NextRequest) {
  const session = await requireUserSession();
  if (!session) return NextResponse.json({ error: "ログインしてください" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Excelファイルを選択してください" }, { status: 400 });
  }
  const isXlsxName = file.name.toLowerCase().endsWith(".xlsx");
  if (!isXlsxName || !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Excelファイル（.xlsx）のみアップロードできます" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "ファイルサイズが大きすぎます（10MBまで）" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const parsed = parseReportWorkbook(workbook);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Excel読み込みに失敗しました", error);
    return NextResponse.json({ error: "Excelの読み込みに失敗しました。対応していない形式の可能性があります。" }, { status: 422 });
  }
}
