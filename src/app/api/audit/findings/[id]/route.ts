import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "");
  if (!["open", "resolved", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const updated = await db.auditFinding.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "resolved" || status === "dismissed" ? new Date() : null,
    },
  });
  return NextResponse.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    resolvedAt: updated.resolvedAt ? updated.resolvedAt.toISOString() : null,
  });
}
