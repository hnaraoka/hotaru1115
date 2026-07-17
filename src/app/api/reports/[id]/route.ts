import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(report);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.report.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "報告書が見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
