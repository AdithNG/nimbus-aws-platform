"use client";

import { Menu, Moon, Sun, ShieldCheck, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import type { SectionId } from "@/lib/types";

const titles: Record<SectionId, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Delivery health & security posture at a glance",
  },
  campaigns: {
    title: "Campaigns",
    subtitle: "Author, schedule, and send through Amazon SES",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Delivery, bounce, and engagement trends",
  },
  audit: {
    title: "Security Audit",
    subtitle: "Autonomous scan of IAM, S3, SES & CloudTrail",
  },
  settings: {
    title: "AWS Settings",
    subtitle: "Connection, SES identity, and sending quota",
  },
};

interface TopbarProps {
  section: SectionId;
  connected: boolean;
  region: string;
  quotaUsed: number;
  quotaLimit: number;
  onMenu: () => void;
  onRunAudit: () => void;
  auditing: boolean;
}

export function Topbar({
  section,
  connected,
  region,
  quotaUsed,
  quotaLimit,
  onMenu,
  onRunAudit,
  auditing,
}: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const t = titles[section];
  const quotaPct = quotaLimit > 0 ? Math.min(100, (quotaUsed / quotaLimit) * 100) : 0;
  const quotaWarn = quotaPct >= 80;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold sm:text-base">
            {t.title}
          </h2>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {t.subtitle}
          </p>
        </div>

        {/* Quota meter — hidden on small screens */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden w-40 items-center gap-2 md:flex">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Daily quota</span>
                    <span className="tabular-nums">
                      {formatNumber(quotaUsed)}/{formatNumber(quotaLimit)}
                    </span>
                  </div>
                  <Progress
                    value={quotaPct}
                    className={cn(
                      "mt-1 h-1.5",
                      quotaWarn && "[&>div]:bg-rose-500"
                    )}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              SES daily sending limit for {region}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex",
            connected
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              connected ? "bg-emerald-500" : "bg-slate-400"
            )}
          />
          {connected ? `AWS · ${region}` : "AWS · Disconnected"}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onRunAudit}
          disabled={auditing}
          className="hidden sm:inline-flex"
        >
          {auditing ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          {auditing ? "Scanning…" : "Run Audit"}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
