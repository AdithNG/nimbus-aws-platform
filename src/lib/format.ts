import type { FindingSeverity } from "./types";

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("en-US");
}

export function formatFull(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function formatDate(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string | Date | null): string {
  if (!iso) return "never";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export const severityStyles: Record<
  FindingSeverity,
  { label: string; badge: string; dot: string; text: string; bg: string }
> = {
  critical: {
    label: "Critical",
    badge: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
  high: {
    label: "High",
    badge:
      "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    dot: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
  },
  medium: {
    label: "Medium",
    badge:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  low: {
    label: "Low",
    badge:
      "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
    dot: "bg-teal-500",
    text: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
  },
  info: {
    label: "Info",
    badge:
      "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-500/10",
  },
};

export const categoryLabels: Record<string, string> = {
  iam: "IAM",
  s3: "S3",
  ses: "SES",
  ec2: "EC2",
  cloudtrail: "CloudTrail",
  general: "General",
};

export function maskAccessKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(Math.max(8, key.length - 8))}${key.slice(-4)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
