"use client";

import {
  Send,
  CheckCircle2,
  AlertTriangle,
  MailOpen,
  MousePointerClick,
  UserMinus,
  ShieldAlert,
  ArrowRight,
  Plus,
  Activity,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/shared/kpi-card";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { StatusBadge } from "@/components/dashboard/shared/status-badge";
import { useFetch } from "@/components/dashboard/shared/api";
import {
  chartColors,
  eventTypeMeta,
} from "@/components/dashboard/shared/chart-colors";
import {
  formatNumber,
  formatPercent,
  formatDate,
} from "@/lib/format";
import type {
  CampaignRow,
  DashboardStats,
  SectionId,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (s: SectionId) => void;
}

const severityBars = [
  { key: "critical", label: "Critical", color: "bg-rose-500" },
  { key: "high", label: "High", color: "bg-orange-500" },
  { key: "medium", label: "Medium", color: "bg-amber-500" },
  { key: "low", label: "Low", color: "bg-teal-500" },
  { key: "info", label: "Info", color: "bg-slate-400" },
] as const;

export function DashboardOverview({ stats, loading, onNavigate }: Props) {
  const trend = stats?.sentTrend ?? [];
  const breakdown = stats?.eventBreakdown ?? [];
  const pieData = breakdown
    .map((b) => ({
      name: eventTypeMeta[b.type]?.label ?? b.type,
      value: b.count,
      color: eventTypeMeta[b.type]?.color ?? chartColors.muted,
    }))
    .filter((d) => d.value > 0);

  const campaigns = useFetch<CampaignRow[]>("/api/campaigns?status=all");
  const recentRows = campaigns.data ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Operations Dashboard"
        description="Autonomous email delivery + AWS security posture, unified."
        icon={Activity}
        actions={
          <>
            <Button variant="outline" onClick={() => onNavigate("audit")}>
              <ShieldAlert className="size-4" />
              Security Audit
            </Button>
            <Button onClick={() => onNavigate("campaigns")}>
              <Plus className="size-4" />
              New Campaign
            </Button>
          </>
        }
      />

      {/* KPI row 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <KpiCard
              label="Total Sent"
              value={formatNumber(stats?.totalSent ?? 0)}
              icon={Send}
              delta={12.4}
              deltaLabel="vs last 14d"
              accent="emerald"
            />
            <KpiCard
              label="Delivery Rate"
              value={formatPercent(stats?.deliveryRate ?? 0)}
              icon={CheckCircle2}
              delta={0.6}
              deltaLabel="vs last 14d"
              accent="teal"
            />
            <KpiCard
              label="Bounce Rate"
              value={formatPercent(stats?.bounceRate ?? 0)}
              icon={AlertTriangle}
              delta={-0.4}
              deltaLabel="lower is better"
              accent="amber"
              invertDelta
            />
            <KpiCard
              label="Open Rate"
              value={formatPercent(stats?.openRate ?? 0)}
              icon={MailOpen}
              delta={3.1}
              deltaLabel="vs last 14d"
              accent="violet"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Send Volume — Last 14 Days</CardTitle>
              <p className="text-xs text-muted-foreground">
                Sent, delivered, and bounced messages per day
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <LegendDot color="var(--chart-1)" label="Sent" />
              <LegendDot color="var(--chart-3)" label="Delivered" />
              <LegendDot color="var(--chart-5)" label="Bounced" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72 w-full">
              {loading && !stats ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trend}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gDelivered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => {
                        const dt = new Date(d);
                        return dt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatNumber(v)}
                      width={48}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sent"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#gSent)"
                    />
                    <Area
                      type="monotone"
                      dataKey="delivered"
                      stroke="var(--chart-3)"
                      strokeWidth={2}
                      fill="url(#gDelivered)"
                    />
                    <Area
                      type="monotone"
                      dataKey="bounced"
                      stroke="var(--chart-5)"
                      strokeWidth={2}
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">All-time message events</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-44">
              {loading && !stats ? (
                <Skeleton className="h-full w-full" />
              ) : pieData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No events yet
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-medium tabular-nums">
                    {formatNumber(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI row 2 — engagement + security */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Click Rate"
          value={formatPercent(stats?.clickRate ?? 0)}
          icon={MousePointerClick}
          accent="amber"
          hint="of delivered"
        />
        <KpiCard
          label="Unsubscribe Rate"
          value={formatPercent(stats?.unsubscribeRate ?? 0, 2)}
          icon={UserMinus}
          accent="rose"
          invertDelta
        />
        <KpiCard
          label="Complaint Rate"
          value={formatPercent(stats?.complaintRate ?? 0, 2)}
          icon={AlertTriangle}
          accent="rose"
          invertDelta
        />
        <KpiCard
          label="Open Findings"
          value={formatNumber(stats?.openFindings ?? 0)}
          icon={ShieldAlert}
          accent={stats && stats.criticalFindings > 0 ? "rose" : "slate"}
          hint={
            stats && stats.criticalFindings > 0
              ? `${stats.criticalFindings} critical`
              : "all clear"
          }
        />
      </div>

      {/* Recent campaigns + audit posture */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Campaigns</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("campaigns")}
            >
              View all
              <ArrowRight className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <RecentCampaignsTable
              loading={campaigns.loading}
              rows={recentRows}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Security Posture</CardTitle>
              <p className="text-xs text-muted-foreground">Latest audit scan</p>
            </div>
            <ShieldAlert className="size-5 text-rose-500" />
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm text-muted-foreground">
              {stats && stats.openFindings > 0
                ? `${stats.openFindings} open findings require remediation.`
                : "No open findings. Your account is in good shape."}
            </p>
            <div className="space-y-2">
              {severityBars.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className={cn("size-2.5 rounded-full", s.color)} />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">—</span>
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              variant={stats && stats.openFindings > 0 ? "default" : "outline"}
              onClick={() => onNavigate("audit")}
            >
              Review findings
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecentCampaignsTable({
  loading,
  rows,
}: {
  loading: boolean;
  rows: CampaignRow[];
}) {
  if (loading && rows.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No campaigns yet.
      </p>
    );
  }
  return (
    <div className="-mx-2 max-h-80 overflow-y-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-2 py-2 font-medium">Campaign</th>
            <th className="px-2 py-2 font-medium">Status</th>
            <th className="px-2 py-2 text-right font-medium">Sent</th>
            <th className="px-2 py-2 text-right font-medium">Deliv.</th>
            <th className="px-2 py-2 text-right font-medium">Bounce</th>
            <th className="px-2 py-2 text-right font-medium">Open</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 6).map((r) => (
            <tr
              key={r.id}
              className="border-t border-border/60 transition-colors hover:bg-muted/40"
            >
              <td className="px-2 py-2.5">
                <div className="font-medium leading-tight">{r.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(r.createdAt)} · {r.audience}
                </div>
              </td>
              <td className="px-2 py-2.5">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums">
                {formatNumber(r.sentCount)}
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatPercent(r.deliveryRate)}
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums text-amber-600 dark:text-amber-400">
                {formatPercent(r.bounceRate)}
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums">
                {formatPercent(r.openRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label ? (
        <p className="mb-1 font-medium">
          {new Date(label).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      ) : null}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-medium tabular-nums">
              {formatNumber(p.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
