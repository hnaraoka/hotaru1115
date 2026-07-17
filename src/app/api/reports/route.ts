import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseReportInput } from "@/lib/report";

export async function GET() {
  const reports = await prisma.report.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(reports);
}

export async function POST(request: NextRequest) {
  let input;
  try {
    const body = await request.json();
    input = parseReportInput(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "入力が不正です";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const report = await prisma.report.create({ data: input });
  return NextResponse.json(report, { status: 201 });
}
