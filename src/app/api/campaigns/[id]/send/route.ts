import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCampaignRow } from "@/lib/mappers";

export const dynamic = "force-dynamic";

// Simulates an Amazon SES send: marks the campaign as sent, generates
// realistic delivery / bounce / open / click / unsubscribe / complaint
// events, and updates aggregate counters. In production this would call
// SES.SendEmail / SendBulkTemplatedEmail and process SNS event notifications.
const RECIPIENT_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "company.com",
];
const FIRST = ["alex", "sam", "jordan", "taylor", "morgan", "casey", "riley"];
const LAST = ["chen", "patel", "garcia", "kim", "nguyen", "rivera"];

function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const recipients = Math.max(100, campaign.recipientCount || 1000);
  const rng = rngFrom(
    recipients + campaign.name.length + campaign.subject.length
  );

  const bounceRate = 0.012 + rng() * 0.02;
  const openRate = 0.34 + rng() * 0.16;
  const clickRate = 0.06 + rng() * 0.06;
  const unsubscribeRate = 0.0015 + rng() * 0.002;
  const complaintRate = 0.0004 + rng() * 0.0006;

  const bounced = Math.round(recipients * bounceRate);
  const delivered = recipients - bounced;
  const opened = Math.round(delivered * openRate);
  const clicked = Math.round(delivered * clickRate);
  const unsubscribed = Math.round(recipients * unsubscribeRate);
  const complained = Math.round(recipients * complaintRate);

  const make = () =>
    `${FIRST[Math.floor(rng() * FIRST.length)]}.${
      LAST[Math.floor(rng() * LAST.length)]
    }${Math.floor(rng() * 99)}@${
      RECIPIENT_DOMAINS[Math.floor(rng() * RECIPIENT_DOMAINS.length)]
    }`;

  const now = Date.now();
  type Ev = {
    type: string;
    recipient: string;
    detail: string | null;
    ts: number;
  };
  const events: Ev[] = [];

  for (let i = 0; i < recipients; i++)
    events.push({
      type: "sent",
      recipient: make(),
      detail: null,
      ts: now + Math.floor(rng() * 30 * 60 * 1000),
    });
  for (let i = 0; i < delivered; i++)
    events.push({
      type: "delivered",
      recipient: make(),
      detail: null,
      ts: now + Math.floor(rng() * 40 * 60 * 1000) + 60_000,
    });
  const bounceReasons = [
    "550 5.1.1 The email account does not exist",
    "550 5.7.1 Message rejected as spam by recipient",
  ];
  for (let i = 0; i < bounced; i++)
    events.push({
      type: "bounce",
      recipient: make(),
      detail: bounceReasons[Math.floor(rng() * bounceReasons.length)],
      ts: now + Math.floor(rng() * 50 * 60 * 1000) + 120_000,
    });
  for (let i = 0; i < opened; i++)
    events.push({
      type: "open",
      recipient: make(),
      detail: null,
      ts: now + Math.floor(rng() * 72 * 60 * 60 * 1000) + 300_000,
    });
  const links = [
    "https://nimbus.io/pricing",
    "https://nimbus.io/features",
    "https://nimbus.io/blog/scaling-ses",
  ];
  for (let i = 0; i < clicked; i++)
    events.push({
      type: "click",
      recipient: make(),
      detail: links[Math.floor(rng() * links.length)],
      ts: now + Math.floor(rng() * 72 * 60 * 60 * 1000) + 600_000,
    });
  for (let i = 0; i < unsubscribed; i++)
    events.push({
      type: "unsubscribe",
      recipient: make(),
      detail: "List-Unsubscribe header",
      ts: now + Math.floor(rng() * 48 * 60 * 60 * 1000) + 900_000,
    });
  for (let i = 0; i < complained; i++)
    events.push({
      type: "complaint",
      recipient: make(),
      detail: "Feedback report received",
      ts: now + Math.floor(rng() * 48 * 60 * 60 * 1000) + 1_200_000,
    });

  events.sort((a, b) => a.ts - b.ts);

  // Clear old events for this campaign (supports re-send), then batch insert.
  await db.emailEvent.deleteMany({ where: { campaignId: id } });
  for (let i = 0; i < events.length; i += 2000) {
    const batch = events.slice(i, i + 2000);
    await db.emailEvent.createMany({
      data: batch.map((e) => ({
        campaignId: id,
        type: e.type,
        recipient: e.recipient,
        detail: e.detail,
        timestamp: new Date(e.ts),
      })),
    });
  }

  const updated = await db.campaign.update({
    where: { id },
    data: {
      status: "sent",
      recipientCount: recipients,
      sentCount: recipients,
      deliveredCount: delivered,
      bounceCount: bounced,
      openCount: opened,
      clickCount: clicked,
      unsubscribeCount: unsubscribed,
      complaintCount: complained,
    },
  });

  // bump daily used quota
  await db.awsSetting
    .update({
      where: { id: "singleton" },
      data: { dailyUsed: { increment: recipients }, lastSyncAt: new Date() },
    })
    .catch(() => null);

  return NextResponse.json(toCampaignRow(updated));
}
