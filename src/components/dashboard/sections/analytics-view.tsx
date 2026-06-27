"use client";

import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  MailOpen,
  MousePointerClick,
  UserMinus,
  Send,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/shared/kpi-card";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { StatusBadge } from "@/components/dashboard/shared/status-badge";
import { useFetch } from "@/components/dashboard/shared/api";
import { eventTypeMeta } from "@/components/dashboard/shared/chart-colors";
import {
  formatNumber,
  formatPercent,
  formatDate,
} from "@/lib/format";
import type { CampaignRow, DashboardStats } from "@/lib/types";

export function AnalyticsView() {
  const { data: stats, loading } = useFetch<DashboardStats>("/api/dashboard");
  const { data: campaigns } = useFetch<CampaignRow[]>("/api/campaigns?status=all");

  const trend = stats?.sentTrend ?? [];
  const breakdown = (stats?.eventBreakdown ?? [])
    .map((b) => ({
      ...b,
      label: eventTypeMeta[b.type]?.label ?? b.type,
      color: eventTypeMeta[b.type]?.color ?? "var(--muted-foreground)",
    }))
    .filter((b) => b.count > 0);

  const comparison = (campaigns ?? [])
    .filter((c) => c.sentCount > 0)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analytics"
        description="Cross-campaign delivery, bounce, and engagement trends."
        icon={BarChart3}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {loading && !stats
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          : (
            <>
              <KpiCard
                label="Total Sent"
                value={formatNumber(stats?.totalSent ?? 0)}
                icon={Send}
                accent="emerald"
              />
              <KpiCard
                label="Delivery"
                value={formatPercent(stats?.deliveryRate ?? 0)}
                icon={CheckCircle2}
                accent="teal"
              />
              <KpiCard
                label="Bounce"
                value={formatPercent(stats?.bounceRate ?? 0)}
                icon={AlertTriangle}
                accent="amber"
                invertDelta
              />
              <KpiCard
                label="Open"
                value={formatPercent(stats?.openRate ?? 0)}
                icon={MailOpen}
                accent="violet"
              />
              <KpiCard
                label="Click"
                value={formatPercent(stats?.clickRate ?? 0)}
                icon={MousePointerClick}
                accent="amber"
              />
              <KpiCard
                label="Unsub."
                value={formatPercent(stats?.unsubscribeRate ?? 0, 2)}
                icon={UserMinus}
                accent="rose"
                invertDelta
              />
            </>
          )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Delivery trend — 14 days</CardTitle>
            <p className="text-xs text-muted-foreground">
              Sent vs delivered vs bounced per day
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72 w-full">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trend}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="aSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="aBounce" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) =>
                        new Date(d).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
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
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                            <p className="mb-1 font-medium">
                              {new Date(label).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            {payload.map((p, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span
                                  className="size-2 rounded-full"
                                  style={{ background: p.color as string }}
                                />
                                <span className="capitalize text-muted-foreground">
                                  {p.name}
                                </span>
                                <span className="ml-auto font-medium tabular-nums">
                                  {formatNumber(p.value as number)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sent"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#aSent)"
                    />
                    <Area
                      type="monotone"
                      dataKey="delivered"
                      stroke="var(--chart-3)"
                      strokeWidth={2}
                      fill="transparent"
                    />
                    <Area
                      type="monotone"
                      dataKey="bounced"
                      stroke="var(--chart-5)"
                      strokeWidth={2}
                      fill="url(#aBounce)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event distribution</CardTitle>
            <p className="text-xs text-muted-foreground">All-time by type</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72 w-full">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={breakdown}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatNumber(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0].payload as {
                          label: string;
                          count: number;
                        };
                        return (
                          <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
                            <p className="font-medium">{p.label}</p>
                            <p className="text-muted-foreground">
                              {formatNumber(p.count)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {breakdown.map((b) => (
                        <Cell key={b.label} fill={b.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign comparison</CardTitle>
          <p className="text-xs text-muted-foreground">
            Delivery &amp; open performance per campaign
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Campaign</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Sent</th>
                  <th className="px-4 py-3 font-medium">Delivery</th>
                  <th className="px-4 py-3 font-medium">Open rate</th>
                  <th className="px-4 py-3 text-right font-medium">Click</th>
                  <th className="px-4 py-3 text-right font-medium">Bounce</th>
                </tr>
              </thead>
              <tbody>
                {comparison.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No sent campaigns to compare yet.
                    </td>
                  </tr>
                ) : (
                  comparison.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/50 transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium leading-tight">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(c.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatNumber(c.sentCount)}
                      </td>
                      <td className="px-4 py-3">
                        <BarCell value={c.deliveryRate} color="var(--chart-3)" />
                      </td>
                      <td className="px-4 py-3">
                        <BarCell value={c.openRate} color="var(--chart-2)" />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatPercent(c.clickRate)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
                        {formatPercent(c.bounceRate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BarCell({ value, color }: { value: number; color: string }) {
  const pct = Math.max(2, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {formatPercent(value)}
      </span>
    </div>
  );
}
