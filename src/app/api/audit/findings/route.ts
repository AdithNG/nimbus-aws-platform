import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { FindingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const severity = sp.get("severity");
  const category = sp.get("category");
  const status = sp.get("status") || "open";

  const where: Record<string, unknown> = {};
  if (severity && severity !== "all") where.severity = severity;
  if (category && category !== "all") where.category = category;
  if (status && status !== "all") where.status = status;

  const findings = await db.auditFinding.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { severity: "desc" }],
    take: 500,
  });

  const rows: FindingRow[] = findings.map((f) => ({
    id: f.id,
    scanId: f.scanId,
    category: f.category as FindingRow["category"],
    severity: f.severity as FindingRow["severity"],
    title: f.title,
    description: f.description,
    resource: f.resource,
    region: f.region,
    remediation: f.remediation,
    status: f.status as FindingRow["status"],
    createdAt: f.createdAt.toISOString(),
    resolvedAt: f.resolvedAt ? f.resolvedAt.toISOString() : null,
  }));

  return NextResponse.json(rows);
}
