import { db } from "./db";
import { generateFindings } from "./audit-engine";

const RECIPIENT_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "company.com",
];

const FIRST = [
  "alex",
  "sam",
  "jordan",
  "taylor",
  "morgan",
  "casey",
  "riley",
  "jamie",
  "drew",
  "quinn",
  "avery",
  "parker",
  "reese",
  "rowan",
  "skyler",
];
const LAST = [
  "chen",
  "patel",
  "garcia",
  "kim",
  "nguyen",
  "rivera",
  "thompson",
  "ahmed",
  "silva",
  "okafor",
];

function rand(seed: { v: number }) {
  // small deterministic LCG so seeds are stable across re-runs
  seed.v = (seed.v * 1664525 + 1013904223) >>> 0;
  return seed.v / 4294967296;
}
function pick<T>(arr: T[], seed: { v: number }): T {
  return arr[Math.floor(rand(seed) * arr.length)];
}
function randInt(seed: { v: number }, min: number, max: number) {
  return Math.floor(rand(seed) * (max - min + 1)) + min;
}

interface SeedCampaign {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  audience: string;
  recipients: number;
  daysAgo: number;
  status: "sent" | "sending" | "scheduled" | "draft" | "paused";
}

const SEED_CAMPAIGNS: SeedCampaign[] = [
  {
    name: "Black Friday Early Access",
    subject: "Your 48-hour early access starts now 🎁",
    fromName: "Nimbus Deals",
    fromEmail: "deals@mail.nimbus.io",
    audience: "Engaged Subscribers",
    recipients: 18420,
    daysAgo: 1,
    status: "sent",
  },
  {
    name: "Weekly Product Digest #42",
    subject: "What shipped this week at Nimbus",
    fromName: "Nimbus Product",
    fromEmail: "product@mail.nimbus.io",
    audience: "All Subscribers",
    recipients: 42130,
    daysAgo: 4,
    status: "sent",
  },
  {
    name: "Re-engagement: We miss you",
    subject: "It's been a while — here's 20% off",
    fromName: "Nimbus Team",
    fromEmail: "hello@mail.nimbus.io",
    audience: "Inactive 90d",
    recipients: 9870,
    daysAgo: 7,
    status: "sent",
  },
  {
    name: "Q4 Webinar Invitation",
    subject: "Join us: Scaling email infra on AWS SES",
    fromName: "Nimbus Events",
    fromEmail: "events@mail.nimbus.io",
    audience: "Power Users",
    recipients: 12480,
    daysAgo: 11,
    status: "sent",
  },
  {
    name: "Holiday Gift Guide",
    subject: "Gifts they'll actually use this year",
    fromName: "Nimbus Deals",
    fromEmail: "deals@mail.nimbus.io",
    audience: "All Subscribers",
    recipients: 52640,
    daysAgo: 18,
    status: "sent",
  },
  {
    name: "New Year Activation",
    subject: "Kick off 2025 with Nimbus Pro",
    fromName: "Nimbus Growth",
    fromEmail: "growth@mail.nimbus.io",
    audience: "Trial Users",
    recipients: 6240,
    daysAgo: 0,
    status: "sending",
  },
  {
    name: "Spring Launch Teaser",
    subject: "Something big is coming this spring 🌱",
    fromName: "Nimbus Product",
    fromEmail: "product@mail.nimbus.io",
    audience: "All Subscribers",
    recipients: 51000,
    daysAgo: 0,
    status: "scheduled",
  },
  {
    name: "Onboarding Drip — Day 3",
    subject: "Set up your first campaign in 2 minutes",
    fromName: "Nimbus Onboarding",
    fromEmail: "onboarding@mail.nimbus.io",
    audience: "New Signups",
    recipients: 0,
    daysAgo: 0,
    status: "draft",
  },
];

function generateEvents(c: SeedCampaign, seed: { v: number }) {
  if (c.recipients === 0) {
    return {
      counts: {
        sent: 0,
        delivered: 0,
        bounced: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0,
        complained: 0,
      },
      events: [],
    };
  }
  const events: {
    type: string;
    recipient: string;
    detail: string | null;
    offsetMs: number;
  }[] = [];

  // realistic funnel rates
  const bounceRate = 0.012 + rand(seed) * 0.02; // 1.2% - 3.2%
  const openRate = 0.34 + rand(seed) * 0.16; // 34% - 50%
  const clickRate = 0.06 + rand(seed) * 0.06; // 6% - 12%
  const unsubscribeRate = 0.0015 + rand(seed) * 0.002;
  const complaintRate = 0.0004 + rand(seed) * 0.0006;

  const bounced = Math.round(c.recipients * bounceRate);
  const delivered = c.recipients - bounced;
  const opened = Math.round(delivered * openRate);
  const clicked = Math.round(delivered * clickRate);
  const unsubscribed = Math.round(c.recipients * unsubscribeRate);
  const complained = Math.round(c.recipients * complaintRate);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const sendStart = now - c.daysAgo * dayMs - randInt(seed, 8, 11) * 60 * 60 * 1000;

  const makeRecipient = () =>
    `${pick(FIRST, seed)}.${pick(LAST, seed)}${randInt(seed, 1, 99)}@${pick(
      RECIPIENT_DOMAINS,
      seed
    )}`;

  // sent events spread over ~30 min
  for (let i = 0; i < c.recipients; i++) {
    events.push({
      type: "sent",
      recipient: makeRecipient(),
      detail: null,
      offsetMs: Math.floor(rand(seed) * 30 * 60 * 1000),
    });
  }
  // delivered for non-bounced, slightly after send
  for (let i = 0; i < delivered; i++) {
    events.push({
      type: "delivered",
      recipient: makeRecipient(),
      detail: null,
      offsetMs: Math.floor(rand(seed) * 40 * 60 * 1000) + 60 * 1000,
    });
  }
  // bounces
  const bounceReasons = [
    "550 5.1.1 The email account does not exist",
    "550 5.7.1 Message rejected as spam by recipient",
    "550 5.4.4 Unable to resolve recipient domain",
  ];
  for (let i = 0; i < bounced; i++) {
    events.push({
      type: "bounce",
      recipient: makeRecipient(),
      detail: pick(bounceReasons, seed),
      offsetMs: Math.floor(rand(seed) * 50 * 60 * 1000) + 2 * 60 * 1000,
    });
  }
  // opens spread over 72h
  for (let i = 0; i < opened; i++) {
    events.push({
      type: "open",
      recipient: makeRecipient(),
      detail: null,
      offsetMs:
        Math.floor(rand(seed) * 72 * 60 * 60 * 1000) + 5 * 60 * 1000,
    });
  }
  // clicks
  const links = [
    "https://nimbus.io/pricing",
    "https://nimbus.io/features",
    "https://nimbus.io/blog/scaling-ses",
    "https://nimbus.io/dashboard",
  ];
  for (let i = 0; i < clicked; i++) {
    events.push({
      type: "click",
      recipient: makeRecipient(),
      detail: pick(links, seed),
      offsetMs: Math.floor(rand(seed) * 72 * 60 * 60 * 1000) + 10 * 60 * 1000,
    });
  }
  for (let i = 0; i < unsubscribed; i++) {
    events.push({
      type: "unsubscribe",
      recipient: makeRecipient(),
      detail: "List-Unsubscribe header",
      offsetMs: Math.floor(rand(seed) * 48 * 60 * 60 * 1000) + 15 * 60 * 1000,
    });
  }
  for (let i = 0; i < complained; i++) {
    events.push({
      type: "complaint",
      recipient: makeRecipient(),
      detail: "Feedback report received",
      offsetMs: Math.floor(rand(seed) * 48 * 60 * 60 * 1000) + 20 * 60 * 1000,
    });
  }

  return {
    counts: {
      sent: c.recipients,
      delivered,
      bounced,
      opened,
      clicked,
      unsubscribed,
      complained,
    },
    events: events
      .map((e) => ({ ...e, ts: sendStart + e.offsetMs }))
      .sort((a, b) => a.ts - b.ts),
  };
}

export async function seedDatabase(opts?: { reset?: boolean }) {
  if (opts?.reset) {
    await db.emailEvent.deleteMany();
    await db.campaign.deleteMany();
    await db.auditFinding.deleteMany();
    await db.auditScan.deleteMany();
    await db.awsSetting.deleteMany();
  }

  // AWS settings singleton
  const existingSettings = await db.awsSetting.findUnique({
    where: { id: "singleton" },
  });
  if (!existingSettings) {
    await db.awsSetting.create({
      data: {
        id: "singleton",
        region: "us-east-1",
        accountAlias: "production",
        accessKeyMasked: "AKIA••••••••QZ7H",
        sesVerifiedDomain: "mail.nimbus.io",
        sesSendingEnabled: true,
        dailySendingLimit: 50000,
        dailyUsed: 42100,
        connected: true,
        lastSyncAt: new Date(),
      },
    });
  }

  // campaigns (skip if any already exist)
  const existingCampaigns = await db.campaign.count();
  if (existingCampaigns === 0) {
    const seed = { v: 0x9e3779b9 };
    for (const c of SEED_CAMPAIGNS) {
      const result = generateEvents(c, seed);
      const counts = result.counts ?? {
        sent: 0,
        delivered: 0,
        bounced: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0,
        complained: 0,
      };
      const scheduledAt =
        c.status === "scheduled"
          ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          : null;
      const createdAt = new Date(
        Date.now() - (c.daysAgo + 1) * 24 * 60 * 60 * 1000
      );
      const campaign = await db.campaign.create({
        data: {
          name: c.name,
          subject: c.subject,
          fromName: c.fromName,
          fromEmail: c.fromEmail,
          status: c.status,
          audience: c.audience,
          recipientCount: c.recipients,
          sentCount: counts.sent,
          deliveredCount: counts.delivered,
          bounceCount: counts.bounced,
          openCount: counts.opened,
          clickCount: counts.clicked,
          unsubscribeCount: counts.unsubscribed,
          complaintCount: counts.complained,
          htmlContent: `<h1>${c.subject}</h1><p>...</p>`,
          scheduledAt,
          createdAt,
        },
      });

      // Insert events in batches of 2000 to stay snappy
      if (result.events.length) {
        for (let i = 0; i < result.events.length; i += 2000) {
          const batch = result.events.slice(i, i + 2000);
          await db.emailEvent.createMany({
            data: batch.map((e) => ({
              campaignId: campaign.id,
              type: e.type,
              recipient: e.recipient,
              detail: e.detail,
              timestamp: new Date(e.ts),
            })),
          });
        }
      }
    }
  }

  // one completed audit scan
  const existingScans = await db.auditScan.count();
  if (existingScans === 0) {
    const scan = await db.auditScan.create({
      data: {
        status: "completed",
        accountsScanned: 1,
        resourcesScanned: 312,
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 47 * 1000),
      },
    });
    const findings = generateFindings(1234);
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    await db.auditFinding.createMany({
      data: findings.map((f) => {
        counts[f.severity as keyof typeof counts]++;
        return {
          scanId: scan.id,
          category: f.category,
          severity: f.severity,
          title: f.title,
          description: f.description,
          resource: f.resource,
          region: f.region,
          remediation: f.remediation,
          status: "open",
          createdAt: new Date(scan.completedAt ?? Date.now()),
        };
      }),
    });
    await db.auditScan.update({
      where: { id: scan.id },
      data: {
        findingsCount: findings.length,
        criticalCount: counts.critical,
        highCount: counts.high,
        mediumCount: counts.medium,
        lowCount: counts.low,
      },
    });
  }

  return { ok: true };
}
