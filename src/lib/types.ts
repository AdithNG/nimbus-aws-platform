export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "paused";

export type EmailEventType =
  | "sent"
  | "delivered"
  | "bounce"
  | "open"
  | "click"
  | "unsubscribe"
  | "complaint";

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";
export type FindingCategory =
  | "iam"
  | "s3"
  | "ses"
  | "ec2"
  | "cloudtrail"
  | "general";
export type FindingStatus = "open" | "resolved" | "dismissed";

export type SectionId =
  | "dashboard"
  | "campaigns"
  | "analytics"
  | "audit"
  | "settings";

export interface DashboardStats {
  totalSent: number;
  deliveryRate: number;
  bounceRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  complaintRate: number;
  activeCampaigns: number;
  dailyQuotaUsed: number;
  dailyQuotaLimit: number;
  openFindings: number;
  criticalFindings: number;
  sentTrend: { date: string; sent: number; delivered: number; bounced: number }[];
  eventBreakdown: { type: string; count: number }[];
}

export interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  status: CampaignStatus;
  audience: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  bounceCount: number;
  openCount: number;
  clickCount: number;
  unsubscribeCount: number;
  complaintCount: number;
  scheduledAt: string | null;
  createdAt: string;
  deliveryRate: number;
  openRate: number;
  bounceRate: number;
  clickRate: number;
}

export interface FindingRow {
  id: string;
  scanId: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  resource: string;
  region: string | null;
  remediation: string;
  status: FindingStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CampaignAnalytics {
  timeseries: {
    date: string;
    sent: number;
    delivered: number;
    bounced: number;
    opened: number;
    clicked: number;
  }[];
  funnel: { stage: string; count: number; rate: number }[];
  topLinks: { url: string; clicks: number }[];
  recentEvents: {
    id: string;
    type: EmailEventType;
    recipient: string;
    detail: string | null;
    timestamp: string;
  }[];
}

export interface AwsSettingsRow {
  region: string;
  accountAlias: string;
  accessKeyMasked: string | null;
  sesVerifiedDomain: string | null;
  sesSendingEnabled: boolean;
  dailySendingLimit: number;
  dailyUsed: number;
  connected: boolean;
  lastSyncAt: string | null;
}
