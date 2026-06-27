"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Mail,
  Search,
  Send,
  Trash2,
  BarChart3,
  CalendarClock,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { StatusBadge } from "@/components/dashboard/shared/status-badge";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import {
  useFetch,
  apiPost,
  apiDelete,
} from "@/components/dashboard/shared/api";
import {
  formatNumber,
  formatPercent,
  formatDate,
  formatDateTime,
} from "@/lib/format";
import type { CampaignRow, CampaignStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CampaignDetail } from "@/components/dashboard/sections/campaign-detail";

const STATUS_FILTERS: { id: CampaignStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
  { id: "sending", label: "Sending" },
  { id: "sent", label: "Sent" },
];

export function CampaignsView() {
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const url =
    filter === "all"
      ? "/api/campaigns?status=all"
      : `/api/campaigns?status=${filter}`;
  const { data, loading, refresh } = useFetch<CampaignRow[]>(url, {
    intervalMs: 20000,
  });

  const rows = (data ?? []).filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.fromEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Campaigns"
        description="Author, schedule, and send campaigns through Amazon SES."
        icon={Mail}
        actions={<CreateCampaignDialog onCreated={() => refresh()} />}
      />

      <Card>
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns…"
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && rows.length === 0 ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No campaigns found"
              description="Create your first campaign to start sending through Amazon SES."
              action={<CreateCampaignDialog onCreated={() => refresh()} />}
            />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Recipients</th>
                    <th className="px-4 py-3 text-right font-medium">Delivery</th>
                    <th className="px-4 py-3 text-right font-medium">Bounce</th>
                    <th className="px-4 py-3 text-right font-medium">Open</th>
                    <th className="px-4 py-3 text-right font-medium">Click</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <CampaignRowItem
                      key={c.id}
                      c={c}
                      onOpen={() => setSelectedId(c.id)}
                      onChanged={refresh}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Campaign Analytics</SheetTitle>
            <SheetDescription>
              Delivery, engagement, and event stream for this campaign.
            </SheetDescription>
          </SheetHeader>
          {selectedId ? (
            <CampaignDetail id={selectedId} onUpdated={refresh} />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CampaignRowItem({
  c,
  onOpen,
  onChanged,
}: {
  c: CampaignRow;
  onOpen: () => void;
  onChanged: () => void;
}) {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await apiPost(`/api/campaigns/${c.id}/send`);
      toast.success("Campaign sent", {
        description: `Queued ${formatNumber(c.recipientCount || 1000)} recipients via SES.`,
      });
      onChanged();
    } catch (e) {
      toast.error("Failed to send", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiDelete(`/api/campaigns/${c.id}`);
      toast.success("Campaign deleted");
      onChanged();
    } catch (e) {
      toast.error("Failed to delete", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const canSend = c.status === "draft" || c.status === "scheduled";

  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-muted/40">
      <td className="px-4 py-3">
        <button onClick={onOpen} className="block text-left">
          <div className="font-medium leading-tight hover:underline">
            {c.name}
          </div>
          <div className="text-xs text-muted-foreground">{c.subject}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {c.fromName} · {c.fromEmail} · {formatDate(c.createdAt)}
          </div>
        </button>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={c.status} />
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {formatNumber(c.recipientCount)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
        {formatPercent(c.deliveryRate)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
        {formatPercent(c.bounceRate)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {formatPercent(c.openRate)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {formatPercent(c.clickRate)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onOpen}
            title="View analytics"
          >
            <BarChart3 className="size-4" />
          </Button>
          {canSend ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              onClick={handleSend}
              disabled={sending}
              title="Send now"
            >
              {sending ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function CreateCampaignDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    fromName: "Nimbus",
    fromEmail: "deals@mail.nimbus.io",
    audience: "All Subscribers",
    recipientCount: 10000,
    scheduledAt: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await apiPost("/api/campaigns", {
        ...form,
        scheduledAt: form.scheduledAt || undefined,
      });
      toast.success("Campaign created", {
        description: form.scheduledAt
          ? `Scheduled for ${formatDateTime(form.scheduledAt)}`
          : "Saved as draft",
      });
      onCreated();
      setOpen(false);
      setForm({
        name: "",
        subject: "",
        fromName: "Nimbus",
        fromEmail: "deals@mail.nimbus.io",
        audience: "All Subscribers",
        recipientCount: 10000,
        scheduledAt: "",
      });
    } catch (e) {
      toast.error("Failed to create campaign", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-thin sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create campaign</DialogTitle>
          <DialogDescription>
            Configure the send. Nimbus will deliver via your verified Amazon SES
            identity.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="c-name">Campaign name</Label>
            <Input
              id="c-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Black Friday Early Access"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-subject">Subject line</Label>
            <Input
              id="c-subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Your 48-hour early access starts now"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="c-from-name">From name</Label>
              <Input
                id="c-from-name"
                value={form.fromName}
                onChange={(e) =>
                  setForm({ ...form, fromName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-from-email">From email</Label>
              <Input
                id="c-from-email"
                value={form.fromEmail}
                onChange={(e) =>
                  setForm({ ...form, fromEmail: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="c-audience">Audience</Label>
              <div className="relative">
                <Users className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="c-audience"
                  className="pl-8"
                  value={form.audience}
                  onChange={(e) =>
                    setForm({ ...form, audience: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-recipients">Recipients</Label>
              <Input
                id="c-recipients"
                type="number"
                min={0}
                value={form.recipientCount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    recipientCount: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-schedule">Schedule (optional)</Label>
            <div className="relative">
              <CalendarClock className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="c-schedule"
                type="datetime-local"
                className="pl-8"
                value={form.scheduledAt}
                onChange={(e) =>
                  setForm({ ...form, scheduledAt: e.target.value })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to save as draft and send manually.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !form.name || !form.subject}>
            {saving ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Create campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
