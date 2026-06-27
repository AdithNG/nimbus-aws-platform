"use client";

import { useCallback, useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { DashboardOverview } from "@/components/dashboard/sections/dashboard-overview";
import { CampaignsView } from "@/components/dashboard/sections/campaigns-view";
import { AnalyticsView } from "@/components/dashboard/sections/analytics-view";
import { SecurityAuditView } from "@/components/dashboard/sections/security-audit-view";
import { SettingsView } from "@/components/dashboard/sections/settings-view";
import { useFetch } from "@/components/dashboard/shared/api";
import { Footer } from "@/components/dashboard/footer";
import type { AwsSettingsRow, DashboardStats, SectionId } from "@/lib/types";

export function DashboardApp() {
  const [section, setSection] = useState<SectionId>(() => {
    if (typeof window === "undefined") return "dashboard";
    const h = window.location.hash.replace("#", "") as SectionId;
    if (
      ["dashboard", "campaigns", "analytics", "audit", "settings"].includes(h)
    ) {
      return h;
    }
    return "dashboard";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditTrigger, setAuditTrigger] = useState(0);

  const stats = useFetch<DashboardStats>("/api/dashboard", { intervalMs: 30000 });
  const aws = useFetch<AwsSettingsRow>("/api/settings/aws", {
    intervalMs: 30000,
  });

  const navigate = useCallback((s: SectionId) => {
    setSection(s);
    window.location.hash = s;
  }, []);

  const handleRunAudit = useCallback(() => {
    navigate("audit");
    setAuditTrigger((n) => n + 1);
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar
          section={section}
          onNavigate={navigate}
          aws={aws.data}
          openFindings={stats.data?.openFindings ?? 0}
          activeCampaigns={stats.data?.activeCampaigns ?? 0}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            section={section}
            connected={aws.data?.connected ?? false}
            region={aws.data?.region ?? "us-east-1"}
            quotaUsed={aws.data?.dailyUsed ?? 0}
            quotaLimit={aws.data?.dailySendingLimit ?? 0}
            onMenu={() => setMobileOpen(true)}
            onRunAudit={handleRunAudit}
            auditing={auditing}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              {section === "dashboard" ? (
                <DashboardOverview
                  stats={stats.data}
                  loading={stats.loading}
                  onNavigate={navigate}
                />
              ) : null}
              {section === "campaigns" ? <CampaignsView /> : null}
              {section === "analytics" ? <AnalyticsView /> : null}
              {section === "audit" ? (
                <SecurityAuditView
                  trigger={auditTrigger}
                  onAuditingChange={setAuditing}
                />
              ) : null}
              {section === "settings" ? (
                <SettingsView aws={aws.data} onChanged={aws.refresh} />
              ) : null}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
