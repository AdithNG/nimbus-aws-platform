"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Filter,
  Server,
  KeyRound,
  Database,
  Cloud,
  FileText,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import {
  useFetch,
  apiPost,
  apiPatch,
} from "@/components/dashboard/shared/api";
import {
  severityStyles,
  categoryLabels,
  formatDateTime,
  timeAgo,
} from "@/lib/format";
import type {
  FindingCategory,
  FindingRow,
  FindingSeverity,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ScanRow {
  id: string;
  status: string;
  accountsScanned: number;
  resourcesScanned: number;
  findingsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  startedAt: string;
  completedAt: string | null;
}

const categoryIcons: Record<FindingCategory, typeof Server> = {
  iam: KeyRound,
  s3: Database,
  ses: Cloud,
  ec2: Server,
  cloudtrail: FileText,
  general: Info,
};

const SEVERITIES: (FindingSeverity | "all")[] = [
  "all",
  "critical",
  "high",
  "medium",
  "low",
  "info",
];
const CATEGORIES: (FindingCategory | "all")[] = [
  "all",
  "iam",
  "s3",
  "ses",
  "ec2",
  "cloudtrail",
  "general",
];

export function SecurityAuditView({
  trigger,
  onAuditingChange,
}: {
  trigger: number;
  onAuditingChange: (v: boolean) => void;
}) {
  const [severity, setSeverity] = useState<FindingSeverity | "all">("all");
  const [category, setCategory] = useState<FindingCategory | "all">("all");
  const [selected, setSelected] = useState<FindingRow | null>(null);
  const [running, setRunning] = useState(false);

  const scansUrl = "/api/audit";
  const findingsUrl = `/api/audit/findings?status=open&severity=${severity}&category=${category}`;
  const { data: scans, loading: scansLoading, refresh: refreshScans } =
    useFetch<ScanRow[]>(scansUrl);
  const { data: findings, loading: findingsLoading, refresh: refreshFindings } =
    useFetch<FindingRow[]>(findingsUrl);

  const latestScan = scans?.[0] ?? null;

  const runScan = async () => {
    setRunning(true);
    onAuditingChange(true);
    try {
      await apiPost("/api/audit/run");
      toast.success("Audit complete", {
        description: "New findings are available below.",
      });
      refreshScans();
      refreshFindings();
    } catch (e) {
      toast.error("Audit failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setRunning(false);
      onAuditingChange(false);
    }
  };

  // Auto-run when triggered from the topbar.
  useEffect(() => {
    if (trigger > 0) runScan();
  }, [trigger]);

  const handleAction = async (
    id: string,
    status: "resolved" | "dismissed"
  ) => {
    try {
      await apiPatch(`/api/audit/findings/${id}`, { status });
      toast.success(
        status === "resolved" ? "Finding resolved" : "Finding dismissed"
      );
      setSelected(null);
      refreshFindings();
      refreshScans();
    } catch (e) {
      toast.error("Action failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const counts = {
    critical: findings?.filter((f) => f.severity === "critical").length ?? 0,
    high: findings?.filter((f) => f.severity === "high").length ?? 0,
    medium: findings?.filter((f) => f.severity === "medium").length ?? 0,
    low: findings?.filter((f) => f.severity === "low").length ?? 0,
    info: findings?.filter((f) => f.severity === "info").length ?? 0,
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Security Audit"
        description="An autonomous agent scans IAM, S3, SES, EC2 & CloudTrail and surfaces remediation steps."
        icon={ShieldCheck}
        actions={
          <Button onClick={runScan} disabled={running}>
            {running ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Run new scan
          </Button>
        }
      />

      {/* Scan summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="ring-1 ring-emerald-500/20">
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-11 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Last scan
              </p>
              <p className="text-sm font-semibold">
                {latestScan ? timeAgo(latestScan.completedAt) : "Never"}
              </p>
              <p className="text-xs text-muted-foreground">
                {latestScan
                  ? `${latestScan.resourcesScanned} resources`
                  : "No scan yet"}
              </p>
            </div>
          </CardContent>
        </Card>
        <SeverityStat
          label="Critical"
          count={counts.critical}
          color="text-rose-600 dark:text-rose-400"
          bg="bg-rose-500/15"
          icon={ShieldAlert}
        />
        <SeverityStat
          label="High"
          count={counts.high}
          color="text-orange-600 dark:text-orange-400"
          bg="bg-orange-500/15"
          icon={ShieldAlert}
        />
        <SeverityStat
          label="Open total"
          count={findings?.length ?? 0}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/15"
          icon={Info}
        />
      </div>

      {/* Findings */}
      <Card>
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Findings</CardTitle>
            <p className="text-xs text-muted-foreground">
              {findings?.length ?? 0} open · sorted by severity
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select
              value={severity}
              onValueChange={(v) => setSeverity(v as FindingSeverity | "all")}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All severities" : severityStyles[s as FindingSeverity].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as FindingCategory | "all")}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "All categories" : categoryLabels[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {findingsLoading && !findings ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !findings || findings.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No open findings"
              description="Either your account is clean, or no scan has matched the current filters."
              action={
                <Button variant="outline" onClick={runScan} disabled={running}>
                  Run a scan
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border/60">
              {findings.map((f) => {
                const sev = severityStyles[f.severity];
                const Icon = categoryIcons[f.category];
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelected(f)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        sev.bg,
                        sev.text
                      )}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {f.title}
                        </p>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {categoryLabels[f.category]} · {f.resource}
                        {f.region ? ` · ${f.region}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "hidden shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium sm:inline",
                        sev.badge
                      )}
                    >
                      {sev.label}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan history */}
      <Card>
        <CardHeader>
          <CardTitle>Scan history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {scansLoading && !scans ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !scans || scans.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No scans recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Started</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Resources</th>
                    <th className="px-4 py-3 text-right font-medium">Critical</th>
                    <th className="px-4 py-3 text-right font-medium">High</th>
                    <th className="px-4 py-3 text-right font-medium">Medium</th>
                    <th className="px-4 py-3 text-right font-medium">Low</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border/50 transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {formatDateTime(s.startedAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.completedAt
                            ? `Completed ${timeAgo(s.completedAt)}`
                            : "In progress…"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            s.status === "completed"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {s.status === "completed" ? "Completed" : "Running"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {s.resourcesScanned}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-rose-600 dark:text-rose-400">
                        {s.criticalCount}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-orange-600 dark:text-orange-400">
                        {s.highCount}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
                        {s.mediumCount}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-teal-600 dark:text-teal-400">
                        {s.lowCount}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {s.findingsCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="pr-8">{selected.title}</SheetTitle>
                <SheetDescription>
                  {categoryLabels[selected.category]} finding ·{" "}
                  {selected.region ?? "global"}
                </SheetDescription>
              </SheetHeader>
              <FindingDetail
                finding={selected}
                onAction={handleAction}
              />
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SeverityStat({
  label,
  count,
  color,
  bg,
  icon: Icon,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
  icon: typeof Server;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-lg",
            bg,
            color
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn("text-2xl font-semibold tabular-nums", color)}>
            {count}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FindingDetail({
  finding,
  onAction,
}: {
  finding: FindingRow;
  onAction: (id: string, status: "resolved" | "dismissed") => void;
}) {
  const sev = severityStyles[finding.severity];
  const Icon = categoryIcons[finding.category];
  return (
    <div className="space-y-4 px-4 pb-6">
      <div className="flex items-center gap-2 pt-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
            sev.badge
          )}
        >
          <span className={cn("size-1.5 rounded-full", sev.dot)} />
          {sev.label}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
          <Icon className="size-3.5" />
          {categoryLabels[finding.category]}
        </span>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Resource
        </p>
        <p className="mt-1 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
          {finding.resource}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Description
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground/90">
          {finding.description}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recommended remediation
        </p>
        <p className="mt-1 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm leading-relaxed">
          {finding.remediation}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Detected
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDateTime(finding.createdAt)}
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1"
          onClick={() => onAction(finding.id, "resolved")}
        >
          <CheckCircle2 className="size-4" />
          Mark resolved
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onAction(finding.id, "dismissed")}
        >
          <XCircle className="size-4" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
