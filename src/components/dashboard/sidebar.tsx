"use client";

import {
  LayoutDashboard,
  Mail,
  BarChart3,
  ShieldCheck,
  Settings,
  Cloud,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SectionId } from "@/lib/types";
import type { AwsSettingsRow } from "@/lib/types";

interface NavItem {
  id: SectionId;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}

const NAV: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview of delivery & security",
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Mail,
    description: "Create & send via Amazon SES",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Delivery, bounce & engagement",
  },
  {
    id: "audit",
    label: "Security Audit",
    icon: ShieldCheck,
    description: "IAM, S3 & SES remediation",
  },
  {
    id: "settings",
    label: "AWS Settings",
    icon: Settings,
    description: "Connection & SES identity",
  },
];

interface SidebarProps {
  section: SectionId;
  onNavigate: (s: SectionId) => void;
  aws: AwsSettingsRow | null;
  openFindings: number;
  activeCampaigns: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  section,
  onNavigate,
  aws,
  openFindings,
  activeCampaigns,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <Zap className="size-5" fill="currentColor" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              Nimbus
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              AWS Email &amp; Admin
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
            onClick={onCloseMobile}
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin p-3">
          <p className="px-3 pb-2 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Platform
          </p>
          {NAV.map((item) => {
            const active = section === item.id;
            const Icon = item.icon;
            const badge =
              item.id === "audit" && openFindings > 0
                ? openFindings
                : item.id === "campaigns" && activeCampaigns > 0
                  ? activeCampaigns
                  : null;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4.5 shrink-0 transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                  )}
                />
                <span className="flex-1 truncate font-medium">{item.label}</span>
                {badge ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      item.id === "audit"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-lg bg-sidebar-accent/60 p-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-md",
                  aws?.connected
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-500/20 text-slate-400"
                )}
              >
                <Cloud className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {aws?.accountAlias ?? "Not connected"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {aws?.connected ? aws.region : "Configure AWS"}
                </p>
              </div>
              <span
                className={cn(
                  "size-2 rounded-full",
                  aws?.connected ? "bg-emerald-400" : "bg-slate-500"
                )}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
