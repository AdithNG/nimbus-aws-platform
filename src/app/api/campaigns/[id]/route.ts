import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCampaignRow } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(toCampaignRow(campaign));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  for (const key of [
    "name",
    "subject",
    "fromName",
    "fromEmail",
    "audience",
    "status",
    "htmlContent",
  ]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.recipientCount !== undefined)
    data.recipientCount = Math.max(0, Number(body.recipientCount) || 0);
  if (body.scheduledAt !== undefined)
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

  const updated = await db.campaign.update({ where: { id }, data });
  return NextResponse.json(toCampaignRow(updated));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.campaign.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
