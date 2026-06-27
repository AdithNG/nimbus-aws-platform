import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCampaignRow } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const where = status && status !== "all" ? { status } : {};
  const campaigns = await db.campaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns.map(toCampaignRow));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const fromName = String(body.fromName ?? "Nimbus").trim();
  const fromEmail = String(body.fromEmail ?? "").trim();
  const audience = String(body.audience ?? "All Subscribers").trim();
  const recipientCount = Math.max(0, Number(body.recipientCount ?? 0) || 0);
  const htmlContent = body.htmlContent ? String(body.htmlContent) : null;
  const status = body.scheduledAt ? "scheduled" : "draft";

  if (!name) {
    return NextResponse.json(
      { error: "Campaign name is required" },
      { status: 400 }
    );
  }
  if (!subject) {
    return NextResponse.json(
      { error: "Subject line is required" },
      { status: 400 }
    );
  }
  if (!fromEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromEmail)) {
    return NextResponse.json(
      { error: "A valid from email is required" },
      { status: 400 }
    );
  }

  const campaign = await db.campaign.create({
    data: {
      name,
      subject,
      fromName,
      fromEmail,
      audience,
      recipientCount,
      htmlContent,
      status,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    },
  });

  return NextResponse.json(toCampaignRow(campaign), { status: 201 });
}
