"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Cloud,
  KeyRound,
  Globe,
  Save,
  Link2,
  Link2Off,
  RefreshCw,
  Trash2,
  Mail,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { apiPut, apiPost } from "@/components/dashboard/shared/api";
import { AWS_REGIONS } from "@/lib/audit-engine";
import { formatNumber, maskAccessKey, timeAgo } from "@/lib/format";
import type { AwsSettingsRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SettingsView({
  aws,
  onChanged,
}: {
  aws: AwsSettingsRow | null;
  onChanged: () => void;
}) {
  const [form, setForm] = useState({
    region: "us-east-1",
    accountAlias: "production",
    accessKey: "",
    sesVerifiedDomain: "",
    sesSendingEnabled: false,
    dailySendingLimit: 50000,
  });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (aws) {
      setForm({
        region: aws.region,
        accountAlias: aws.accountAlias,
        accessKey: "",
        sesVerifiedDomain: aws.sesVerifiedDomain ?? "",
        sesSendingEnabled: aws.sesSendingEnabled,
        dailySendingLimit: aws.dailySendingLimit,
      });
    }
  }, [aws]);

  const save = async (connect: boolean) => {
    setSaving(true);
    try {
      await apiPut("/api/settings/aws", {
        region: form.region,
        accountAlias: form.accountAlias,
        accessKey: form.accessKey || undefined,
        sesVerifiedDomain: form.sesVerifiedDomain || null,
        sesSendingEnabled: form.sesSendingEnabled,
        dailySendingLimit: form.dailySendingLimit,
        connect,
      });
      toast.success(connect ? "AWS connected" : "Settings saved", {
        description: connect
          ? `Identity verified in ${form.region}`
          : "Configuration updated",
      });
      onChanged();
    } catch (e) {
      toast.error("Failed to save", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    setSaving(true);
    try {
      await apiPut("/api/settings/aws", { disconnect: true });
      toast.success("AWS disconnected");
      onChanged();
    } catch (e) {
      toast.error("Failed to disconnect", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetDemo = async () => {
    setResetting(true);
    try {
      await apiPost("/api/seed");
      toast.success("Demo data reset", {
        description: "Refreshing…",
      });
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.error("Reset failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
      setResetting(false);
    }
  };

  if (!aws) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="AWS Settings"
          description="Configure your Amazon SES connection and sending quota."
          icon={Cloud}
        />
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const quotaPct =
    aws.dailySendingLimit > 0
      ? Math.min(100, (aws.dailyUsed / aws.dailySendingLimit) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="AWS Settings"
        description="Configure your Amazon SES connection and sending quota."
        icon={Cloud}
        actions={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="size-4" />
                Reset demo data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears all campaigns, events, and audit findings, then
                  re-seeds the platform with fresh sample data. This cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={resetDemo}
                  disabled={resetting}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {resetting ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Reset everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />

      {/* Connection status */}
      <Card className={cn("ring-1", aws.connected ? "ring-emerald-500/20" : "ring-amber-500/20")}>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-lg",
                aws.connected
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              )}
            >
              <Cloud className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">
                  {aws.connected ? "AWS account connected" : "AWS not connected"}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    aws.connected
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}
                >
                  {aws.connected ? "Active" : "Pending"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {aws.connected
                  ? `${aws.accountAlias} · ${aws.region} · last synced ${timeAgo(aws.lastSyncAt)}`
                  : "Connect your AWS account to enable SES sending and security audits."}
              </p>
            </div>
          </div>
          {aws.connected ? (
            <Button variant="outline" onClick={disconnect} disabled={saving}>
              <Link2Off className="size-4" />
              Disconnect
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* Configuration form */}
      <Card>
        <CardHeader>
          <CardTitle>Connection configuration</CardTitle>
          <CardDescription>
            Credentials are validated against the AWS STS <code>GetCallerIdentity</code> action. The raw secret is never stored — only a masked reference is retained.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="region">AWS region</Label>
              <Select
                value={form.region}
                onValueChange={(v) => setForm({ ...form, region: v })}
              >
                <SelectTrigger id="region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AWS_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="alias">Account alias</Label>
              <Input
                id="alias"
                value={form.accountAlias}
                onChange={(e) =>
                  setForm({ ...form, accountAlias: e.target.value })
                }
                placeholder="production"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="accessKey">Access key ID</Label>
            <div className="relative">
              <KeyRound className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="accessKey"
                className="pl-8 font-mono"
                placeholder={
                  aws.accessKeyMasked
                    ? `Current: ${aws.accessKeyMasked}  (enter new to rotate)`
                    : "AKIA…  (20 characters)"
                }
                value={form.accessKey}
                onChange={(e) =>
                  setForm({ ...form, accessKey: e.target.value })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Format: <code>AKIA</code> followed by 16 uppercase alphanumeric characters.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="sesDomain">SES verified domain</Label>
            <div className="relative">
              <Globe className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="sesDomain"
                className="pl-8"
                placeholder="mail.example.com"
                value={form.sesVerifiedDomain}
                onChange={(e) =>
                  setForm({ ...form, sesVerifiedDomain: e.target.value })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The verified identity Nimbus will use as the <code>From</code> domain.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="quota">Daily sending limit</Label>
              <Input
                id="quota"
                type="number"
                min={1}
                value={form.dailySendingLimit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dailySendingLimit: Number(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  SES sending enabled
                </span>
                <Switch
                  checked={form.sesSendingEnabled}
                  onCheckedChange={(v) =>
                    setForm({ ...form, sesSendingEnabled: v })
                  }
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => save(false)} disabled={saving}>
              <Save className="size-4" />
              Save changes
            </Button>
            <Button onClick={() => save(true)} disabled={saving}>
              {saving ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Link2 className="size-4" />
              )}
              {aws.connected ? "Re-verify connection" : "Connect & verify"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quota usage */}
      <Card>
        <CardHeader>
          <CardTitle>Sending quota</CardTitle>
          <CardDescription>
            Current usage against your SES daily sending limit in {aws.region}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold tabular-nums">
                {formatNumber(aws.dailyUsed)}
              </p>
              <p className="text-xs text-muted-foreground">
                of {formatNumber(aws.dailySendingLimit)} sent today
              </p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  quotaPct >= 80
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {quotaPct.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">utilized</p>
            </div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                quotaPct >= 80 ? "bg-rose-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.max(2, quotaPct)}%` }}
            />
          </div>
          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            Quota resets at 00:00 UTC. Request increases via the SES console.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
