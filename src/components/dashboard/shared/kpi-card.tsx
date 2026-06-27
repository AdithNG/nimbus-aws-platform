"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  hint?: string;
  accent?: "emerald" | "amber" | "rose" | "teal" | "violet" | "slate";
  invertDelta?: boolean;
}

const accentMap: Record<
  NonNullable<KpiCardProps["accent"]>,
  { icon: string; ring: string }
> = {
  emerald: {
    icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
  },
  rose: {
    icon: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/20",
  },
  teal: {
    icon: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    ring: "ring-teal-500/20",
  },
  violet: {
    icon: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/20",
  },
  slate: {
    icon: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
    ring: "ring-slate-500/20",
  },
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  hint,
  accent = "emerald",
  invertDelta,
}: KpiCardProps) {
  const a = accentMap[accent];
  const positive = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) > 0;
  const showDelta = typeof delta === "number";
  return (
    <Card className={cn("p-5 gap-0 ring-1", a.ring)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            a.icon
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {showDelta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
              positive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}
          >
            {positive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {Math.abs(delta!).toFixed(1)}%
          </span>
        ) : null}
        {deltaLabel ? (
          <span className="text-muted-foreground">{deltaLabel}</span>
        ) : null}
        {hint ? (
          <span className="ml-auto text-muted-foreground">{hint}</span>
        ) : null}
      </div>
    </Card>
  );
}
