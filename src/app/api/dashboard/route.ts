import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import type { DashboardStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  // Ensure the DB has data to show on first load.
  const campaignCount = await db.campaign.count();
  if (campaignCount === 0) {
    await seedDatabase();
  }

  const campaigns = await db.campaign.findMany();
  const aws = await db.awsSetting.findUnique({ where: { id: "singleton" } });

  const totalSent = campaigns.reduce((s, c) => s + c.sentCount, 0);
  const totalDelivered = campaigns.reduce((s, c) => s + c.deliveredCount, 0);
  const totalBounced = campaigns.reduce((s, c) => s + c.bounceCount, 0);
  const totalOpened = campaigns.reduce((s, c) => s + c.openCount, 0);
  const totalClicked = campaigns.reduce((s, c) => s + c.clickCount, 0);
  const totalUnsub = campaigns.reduce((s, c) => s + c.unsubscribeCount, 0);
  const totalComplaint = campaigns.reduce((s, c) => s + c.complaintCount, 0);

  const safe = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);
  const activeCampaigns = campaigns.filter(
    (c) =>
      c.status === "sending" ||
      c.status === "scheduled" ||
      c.status === "draft"
  ).length;

  // 14-day sent trend via SQL aggregation (avoids loading every event row)
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const trendRows = (await db.$queryRaw<{ day: string; type: string; c: number }[]>`
    SELECT date(timestamp) AS day, type, COUNT(*) AS c
    FROM EmailEvent
    WHERE timestamp >= ${since}
      AND type IN ('sent', 'delivered', 'bounce')
    GROUP BY date(timestamp), type
  `);

  const days: {
    date: string;
    sent: number;
    delivered: number;
    bounced: number;
  }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, sent: 0, delivered: 0, bounced: 0 });
  }
  const dayMap = new Map(days.map((d) => [d.date, d]));
  for (const r of trendRows) {
    const bucket = dayMap.get(r.day);
    if (!bucket) continue;
    if (r.type === "sent") bucket.sent += Number(r.c);
    else if (r.type === "delivered") bucket.delivered += Number(r.c);
    else if (r.type === "bounce") bucket.bounced += Number(r.c);
  }

  // event breakdown across all campaigns
  const breakdownRaw = await db.emailEvent.groupBy({
    by: ["type"],
    _count: { type: true },
  });
  const eventBreakdown = breakdownRaw
    .map((b) => ({ type: b.type, count: b._count.type }))
    .sort((a, b) => b.count - a.count);

  // findings summary
  const openFindings = await db.auditFinding.count({
    where: { status: "open" },
  });
  const criticalFindings = await db.auditFinding.count({
    where: { status: "open", severity: "critical" },
  });

  const stats: DashboardStats = {
    totalSent,
    deliveryRate: safe(totalDelivered, totalSent),
    bounceRate: safe(totalBounced, totalSent),
    openRate: safe(totalOpened, totalDelivered),
    clickRate: safe(totalClicked, totalDelivered),
    unsubscribeRate: safe(totalUnsub, totalDelivered),
    complaintRate: safe(totalComplaint, totalDelivered),
    activeCampaigns,
    dailyQuotaUsed: aws?.dailyUsed ?? 0,
    dailyQuotaLimit: aws?.dailySendingLimit ?? 0,
    openFindings,
    criticalFindings,
    sentTrend: days,
    eventBreakdown,
  };

  return NextResponse.json(stats);
}
