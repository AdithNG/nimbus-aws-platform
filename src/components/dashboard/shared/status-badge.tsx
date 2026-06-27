"use client";

import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/types";

const statusStyles: Record<
  CampaignStatus,
  { label: string; className: string; dot: string }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
    dot: "bg-slate-400",
  },
  scheduled: {
    label: "Scheduled",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  sending: {
    label: "Sending",
    className:
      "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    dot: "bg-teal-500 animate-pulse",
  },
  sent: {
    label: "Sent",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  paused: {
    label: "Paused",
    className:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: CampaignStatus;
  className?: string;
}) {
  const s = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        s.className,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
