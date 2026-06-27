"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Send, RefreshCw, ExternalLink, Inbox } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/shared/status-badge";
import { useFetch, apiPost } from "@/components/dashboard/shared/api";
import { eventTypeMeta } from "@/components/dashboard/shared/chart-colors";
import {
  formatNumber,
  formatPercent,
  formatDateTime,
} from "@/lib/format";
import type { CampaignAnalytics, CampaignRow } from "@/lib/types";

const funnelColors = ["var(--chart-1)", "var(--chart-3)", "var(--chart-2)", "var(--chart-4)"];

export function CampaignDetail({
  id,
  onUpdated,
}: {
  id: string;
  onUpdated: () => void;
}) {
  const { data: campaign, loading: cLoading } = useFetch<CampaignRow>(
    `/api/campaigns/${id}`
  );
  const { data: analytics, loading: aLoading } = useFetch<CampaignAnalytics>(
    `/api/campaigns/${id}/analytics`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await apiPost(`/api/campaigns/${id}/send`);
      toast.success("Campaign sent via Amazon SES");
      onUpdated();
    } catch (e) {
      toast.error("Failed to send", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSending(false);
    }
  };

  if (cLoading && !campaign) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!campaign) {
    return (
      <p className="p-4 text-sm text-muted-foreground">Campaign not found.</p>
    );
  }

  const ts = analytics?.timeseries ?? [];
  const funnel = analytics?.funnel ?? [];
  const topLinks = analytics?.topLinks ?? [];
  const recentEvents = analytics?.recentEvents ?? [];

  return (
    <div className="space-y-4 px-4 pb-6">
      <div className="flex items-start justify-between gap-3 pt-2">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight">
            {campaign.name}
          </h3>
          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StatusBadge status={campaign.status} />
            <span>{campaign.fromEmail}</span>
            <span>·</span>
            <span>{campaign.audience}</span>
          </div>
        </div>
        {(campaign.status === "draft" || campaign.status === "scheduled") ? (
          <Button size="sm" onClick={handleSend} disabled={sending}>
            {sending ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Send now
          </Button>
        ) : null}
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Recipients" value={formatNumber(campaign.recipientCount)} />
        <MiniStat
          label="Delivered"
          value={formatNumber(campaign.deliveredCount)}
          sub={formatPercent(campaign.deliveryRate)}
        />
        <MiniStat
          label="Opens"
          value={formatNumber(campaign.openCount)}
          sub={formatPercent(campaign.openRate)}
        />
        <MiniStat
          label="Clicks"
          value={formatNumber(campaign.clickCount)}
          sub={formatPercent(campaign.clickRate)}
        />
      </div>

      {/* Timeseries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Engagement over time</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-52 w-full">
            {aLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={ts}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
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
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={16}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatNumber(v)}
                    width={40}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-[11px] shadow-md">
                          <p className="mb-0.5 font-medium">
                            {new Date(label).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          {payload.map((p, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span
                                className="size-1.5 rounded-full"
                                style={{ background: p.color }}
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
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="opened"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicked"
                    stroke="var(--chart-4)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <Dot color="var(--chart-1)" label="Sent" />
            <Dot color="var(--chart-2)" label="Opened" />
            <Dot color="var(--chart-4)" label="Clicked" />
          </div>
        </CardContent>
      </Card>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Conversion funnel</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-44 w-full">
            {aLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnel}
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
                    dataKey="stage"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as {
                        stage: string;
                        count: number;
                        rate: number;
                      };
                      return (
                        <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-[11px] shadow-md">
                          <p className="font-medium">{p.stage}</p>
                          <p className="text-muted-foreground">
                            {formatNumber(p.count)} ({formatPercent(p.rate)})
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {funnel.map((_, i) => (
                      <Cell key={i} fill={funnelColors[i % funnelColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top links + recent events */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top clicked links</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {topLinks.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No clicks recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {topLinks.map((l) => (
                  <div
                    key={l.url}
                    className="flex items-center gap-2 text-sm"
                  >
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{l.url}</span>
                    <Badge variant="secondary" className="ml-auto tabular-nums">
                      {formatNumber(l.clicks)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Inbox className="size-4" />
              Recent events
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentEvents.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No events yet. Send the campaign to populate.
              </p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin">
                {recentEvents.map((e) => {
                  const meta = eventTypeMeta[e.type];
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: meta?.color }}
                      />
                      <span className="font-medium capitalize">{meta?.label ?? e.type}</span>
                      <span className="truncate text-muted-foreground">
                        {e.recipient}
                      </span>
                      {e.detail ? (
                        <span className="hidden truncate text-muted-foreground sm:inline">
                          · {e.detail}
                        </span>
                      ) : null}
                      <span className="ml-auto shrink-0 text-muted-foreground">
                        {formatDateTime(e.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {sub ? (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
