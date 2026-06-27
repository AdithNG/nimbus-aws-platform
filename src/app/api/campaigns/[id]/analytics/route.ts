import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CampaignAnalytics } from "@/lib/types";

export const dynamic = "force-dynamic";

interface TrendRow {
  day: string;
  type: string;
  c: number;
}
interface LinkRow {
  detail: string;
  c: number;
}
interface RecentRow {
  id: string;
  type: string;
  recipient: string;
  detail: string | null;
  timestamp: Date;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Timeseries via SQL aggregation grouped by day + type (7-day window from send)
  const firstEvent = await db.emailEvent.findFirst({
    where: { campaignId: id },
    orderBy: { timestamp: "asc" },
    select: { timestamp: true },
  });
  const start = new Date(firstEvent?.timestamp ?? campaign.createdAt);
  start.setHours(0, 0, 0, 0);

  const trendRows = await db.$queryRaw<TrendRow[]>`
    SELECT date(timestamp) AS day, type, COUNT(*) AS c
    FROM EmailEvent
    WHERE campaignId = ${id}
    GROUP BY date(timestamp), type
  `;

  const days: {
    date: string;
    sent: number;
    delivered: number;
    bounced: number;
    opened: number;
    clicked: number;
  }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      date: key,
      sent: 0,
      delivered: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
    });
  }
  const dayMap = new Map(days.map((d) => [d.date, d]));
  for (const r of trendRows) {
    const bucket = dayMap.get(r.day);
    if (!bucket) continue;
    const c = Number(r.c);
    if (r.type === "sent") bucket.sent += c;
    else if (r.type === "delivered") bucket.delivered += c;
    else if (r.type === "bounce") bucket.bounced += c;
    else if (r.type === "open") bucket.opened += c;
    else if (r.type === "click") bucket.clicked += c;
  }

  // Funnel from campaign aggregate counts
  const safe = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);
  const funnel = [
    { stage: "Sent", count: campaign.sentCount, rate: 100 },
    {
      stage: "Delivered",
      count: campaign.deliveredCount,
      rate: safe(campaign.deliveredCount, campaign.sentCount),
    },
    {
      stage: "Opened",
      count: campaign.openCount,
      rate: safe(campaign.openCount, campaign.sentCount),
    },
    {
      stage: "Clicked",
      count: campaign.clickCount,
      rate: safe(campaign.clickCount, campaign.sentCount),
    },
  ];

  // Top clicked links via SQL aggregation
  const linkRows = await db.$queryRaw<LinkRow[]>`
    SELECT detail, COUNT(*) AS c
    FROM EmailEvent
    WHERE campaignId = ${id} AND type = 'click' AND detail IS NOT NULL
    GROUP BY detail
    ORDER BY c DESC
    LIMIT 5
  `;
  const topLinks = linkRows.map((r) => ({
    url: r.detail,
    clicks: Number(r.c),
  }));

  // Recent events — bounded query, newest first
  const recent = await db.emailEvent.findMany({
    where: { campaignId: id },
    orderBy: { timestamp: "desc" },
    take: 60,
    select: { id: true, type: true, recipient: true, detail: true, timestamp: true },
  });
  const recentEvents = recent.map((e) => ({
    id: e.id,
    type: e.type as CampaignAnalytics["recentEvents"][number]["type"],
    recipient: e.recipient,
    detail: e.detail,
    timestamp: e.timestamp.toISOString(),
  }));

  const analytics: CampaignAnalytics = {
    timeseries: days,
    funnel,
    topLinks,
    recentEvents,
  };

  return NextResponse.json(analytics);
}
