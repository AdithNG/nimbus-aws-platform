import type { Campaign, Prisma } from "@prisma/client";
import type { CampaignRow } from "./types";

export function toCampaignRow(c: Campaign): CampaignRow {
  const sent = c.sentCount;
  const delivered = c.deliveredCount;
  const safe = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);
  return {
    id: c.id,
    name: c.name,
    subject: c.subject,
    fromName: c.fromName,
    fromEmail: c.fromEmail,
    status: c.status as CampaignRow["status"],
    audience: c.audience,
    recipientCount: c.recipientCount,
    sentCount: c.sentCount,
    deliveredCount: c.deliveredCount,
    bounceCount: c.bounceCount,
    openCount: c.openCount,
    clickCount: c.clickCount,
    unsubscribeCount: c.unsubscribeCount,
    complaintCount: c.complaintCount,
    scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    deliveryRate: safe(delivered, sent),
    openRate: safe(c.openCount, delivered),
    bounceRate: safe(c.bounceCount, sent),
    clickRate: safe(c.clickCount, delivered),
  };
}

export const campaignInclude = {} satisfies Prisma.CampaignInclude;
