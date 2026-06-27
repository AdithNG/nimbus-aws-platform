import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const scans = await db.auditScan.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
  });
  return NextResponse.json(
    scans.map((s) => ({
      ...s,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
    }))
  );
}
