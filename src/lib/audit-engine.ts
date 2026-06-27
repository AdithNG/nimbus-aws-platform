import type {
  FindingCategory,
  FindingSeverity,
} from "./types";

interface FindingTemplate {
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  resource: string;
  region: string;
  remediation: string;
}

// Realistic AWS misconfiguration findings an autonomous agent would surface
// when auditing a connected account. These mirror the kinds of issues AWS
// Trusted Advisor / Security Hub flag in practice.
const FINDING_TEMPLATES: FindingTemplate[] = [
  {
    category: "iam",
    severity: "critical",
    title: "Active IAM access key unused for 90+ days",
    description:
      "Access key AKIA********QZ7H2 associated with user 'ci-deployer' has not been used in 94 days. Stale long-lived credentials are a primary vector for account compromise.",
    resource: "arn:aws:iam::123456789012:user/ci-deployer",
    region: "global",
    remediation:
      "Deactivate the key via `aws iam update-access-key --status Inactive`, rotate credentials to short-lived role-based auth (OIDC/STS), then delete the key once CI pipelines are migrated.",
  },
  {
    category: "iam",
    severity: "critical",
    title: "IAM user with password login but no MFA",
    description:
      "User 'legacy-admin' has console password access enabled but no MFA device enrolled. If credentials leak, the account is fully exposed.",
    resource: "arn:aws:iam::123456789012:user/legacy-admin",
    region: "global",
    remediation:
      "Enforce MFA with an IAM policy that denies all actions except `iam:CreateVirtualMFADevice` when MFA is absent. Optionally remove console access if CLI-only.",
  },
  {
    category: "iam",
    severity: "high",
    title: "Overly permissive policy: Action='*' Resource='*'",
    description:
      "Role 'EC2-LaunchRole' grants `ec2:*` and `s3:*` on `*` resources. Violates least-privilege and enables privilege escalation paths.",
    resource: "arn:aws:iam::123456789012:role/EC2-LaunchRole",
    region: "global",
    remediation:
      "Scope the policy to specific ARNs and required actions only. Use IAM Access Analyzer to generate a refined policy based on actual usage from CloudTrail.",
  },
  {
    category: "iam",
    severity: "medium",
    title: "IAM access key older than 1 year",
    description:
      "Access key for 'marketing-service' was created 411 days ago. Long-lived keys should be rotated at least every 90 days.",
    resource: "arn:aws:iam::123456789012:user/marketing-service",
    region: "global",
    remediation:
      "Create a new key, update the consuming service, verify functionality, then deactivate and delete the old key.",
  },
  {
    category: "s3",
    severity: "critical",
    title: "S3 bucket allows public READ via policy",
    description:
      "Bucket 'marketing-assets-public' has a bucket policy granting `s3:GetObject` to `*` principals. Contents are world-readable and indexed by search engines.",
    resource: "arn:aws:s3:::marketing-assets-public",
    region: "us-east-1",
    remediation:
      "Remove the public principal from the policy. If public access is genuinely required, front the bucket with CloudFront + Origin Access Control and enable Block Public Access at the account level.",
  },
  {
    category: "s3",
    severity: "high",
    title: "S3 bucket has default encryption disabled",
    description:
      "Bucket 'customer-backups-2024' has no SSE-S3 or SSE-KMS default encryption. Objects uploaded without explicit encryption are stored in plaintext.",
    resource: "arn:aws:s3:::customer-backups-2024",
    region: "us-west-2",
    remediation:
      "Enable default encryption (SSE-KMS recommended) on the bucket and add an SCP denying unencrypted PutObject calls.",
  },
  {
    category: "s3",
    severity: "medium",
    title: "S3 bucket versioning disabled",
    description:
      "Bucket 'audit-logs-archive' has versioning suspended. Accidental deletes or overwrites cannot be recovered.",
    resource: "arn:aws:s3:::audit-logs-archive",
    region: "us-east-1",
    remediation:
      "Enable versioning + MFA delete on the bucket and configure a lifecycle policy to transition non-current versions to Glacier.",
  },
  {
    category: "s3",
    severity: "low",
    title: "S3 bucket lacks lifecycle policy",
    description:
      "Bucket 'raw-events' has no lifecycle rules. Storage costs will grow unbounded as ingest continues.",
    resource: "arn:aws:s3:::raw-events",
    region: "us-east-1",
    remediation:
      "Add a lifecycle rule transitioning objects to Standard-IA after 30 days and Glacier after 90 days, with expiration after 365 days.",
  },
  {
    category: "ses",
    severity: "high",
    title: "SES sending quota above 80% utilization",
    description:
      "Daily sending quota at 84% (42,100 / 50,000). Approaching the soft limit risks throttling for time-sensitive campaigns.",
    resource: "ses:us-east-1",
    region: "us-east-1",
    remediation:
      "Request a quota increase via the SES console or switch to a dedicated IP pool. Consider splitting large sends across regions.",
  },
  {
    category: "ses",
    severity: "medium",
    title: "SES domain has no DKIM signing enabled",
    description:
      "Verified identity 'news.example.com' does not have DKIM tokens published. Emails are more likely to be filtered as spam.",
    resource: "ses:news.example.com",
    region: "us-east-1",
    remediation:
      "Enable Easy DKIM in SES, publish the three CNAME records to DNS, and verify the tokens become 'Success'. Also publish a DMARC record with p=quarantine.",
  },
  {
    category: "ses",
    severity: "medium",
    title: "SES bounce rate above 5% threshold",
    description:
      "Identity 'promo.example.com' has a bounce rate of 6.8% over the last 24h. Sustained high bounce rates trigger SES automatic pausing.",
    resource: "ses:promo.example.com",
    region: "us-east-1",
    remediation:
      "Suppress hard-bounced addresses via the SES suppression list, validate recipient lists with a hygiene service, and segment inactive subscribers.",
  },
  {
    category: "ec2",
    severity: "high",
    title: "Security group exposes SSH (22) to 0.0.0.0/0",
    description:
      "Security group 'sg-launch-wizard-1' allows inbound TCP/22 from the entire internet on 3 EC2 instances.",
    resource: "arn:aws:ec2:us-east-1:123456789012:security-group/sg-launch-wizard-1",
    region: "us-east-1",
    remediation:
      "Restrict the ingress rule to your corporate CIDR or remove it entirely and require SSM Session Manager for shell access.",
  },
  {
    category: "ec2",
    severity: "medium",
    title: "EC2 instance running stopped-but-billed EBS volumes",
    description:
      "3 EBS volumes are unattached yet remain provisioned, accruing ~$45/mo in storage charges.",
    resource: "arn:aws:ec2:us-east-1:123456789012:volume/vol-0a1b2c3d",
    region: "us-east-1",
    remediation:
      "Snapshot volumes that may be needed later, then delete the unattached volumes to recover cost.",
  },
  {
    category: "ec2",
    severity: "low",
    title: "EC2 instance using previous-generation type",
    description:
      "Instance 'i-bastion-prod' is a t2.micro. t3 instances offer better price/performance and burst behavior.",
    resource: "arn:aws:ec2:us-east-1:123456789012:instance/i-bastion-prod",
    region: "us-east-1",
    remediation:
      "Stop the instance, change the instance type to t3.micro, and start. Validate application behavior post-migration.",
  },
  {
    category: "cloudtrail",
    severity: "high",
    title: "CloudTrail log file validation disabled",
    description:
      "Trail 'management-events' has log file validation off. Tampered logs cannot be cryptographically detected.",
    resource: "arn:aws:cloudtrail:us-east-1:123456789012:trail/management-events",
    region: "us-east-1",
    remediation:
      "Enable log file validation on the trail and consider forwarding logs to a write-once S3 bucket with object lock.",
  },
  {
    category: "cloudtrail",
    severity: "medium",
    title: "CloudTrail not enabled in all regions",
    description:
      "The trail only captures events in us-east-1. Activity in other regions is invisible to audit.",
    resource: "arn:aws:cloudtrail:us-east-1:123456789012:trail/management-events",
    region: "us-east-1",
    remediation:
      "Set `IsMultiRegionTrail=true` and enable global service events to capture IAM and STS activity centrally.",
  },
  {
    category: "general",
    severity: "info",
    title: "No AWS Budget alert configured",
    description:
      "The account has no billing budget or anomaly alert. Cost spikes from misconfigured resources may go unnoticed.",
    resource: "account:123456789012",
    region: "us-east-1",
    remediation:
      "Create a monthly cost budget with a 100% alert threshold and subscribe an SNS topic with your team's email.",
  },
  {
    category: "general",
    severity: "low",
    title: "Root account has active access keys",
    description:
      "The root account has 1 active access key. Root keys grant unrestricted access and should never exist for routine use.",
    resource: "arn:aws:iam::123456789012:root",
    region: "global",
    remediation:
      "Delete the root access key immediately. Use an IAM user or role with scoped permissions for programmatic access.",
  },
];

export function generateFindings(seed?: number): FindingTemplate[] {
  // Deterministic selection when a seed is supplied so repeat scans of the
  // same "account state" stay stable. Otherwise return the full template set.
  if (seed === undefined) return FINDING_TEMPLATES;
  const rng = mulberry32(seed);
  const shuffled = [...FINDING_TEMPLATES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const count = 8 + Math.floor(rng() * (shuffled.length - 8));
  return shuffled.slice(0, count);
}

export const AWS_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-south-1",
  "ap-southeast-1",
  "ap-northeast-1",
];

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
