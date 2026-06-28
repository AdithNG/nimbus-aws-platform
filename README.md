# Nimbus — Autonomous AWS Email & Admin Platform

> Provision Amazon SES, run email campaigns, and autonomously audit your AWS account for IAM, S3, SES, EC2, and CloudTrail misconfigurations — all from a single dashboard.

Nimbus is a production-style SaaS admin console that unifies **transactional & marketing email delivery** with **continuous security auditing** of a connected AWS account. Instead of paying for a separate ESP *and* a security scanner, you point Nimbus at your AWS account and get both: a campaign studio backed by SES, and an autonomous agent that surfaces stale IAM keys, public S3 buckets, missing DKIM, exposed security groups, and more — each with a copy-pasteable remediation step.

Built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts, and Prisma.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Security Audit Engine](#security-audit-engine)
- [Data Model](#data-model)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

### Email Marketing (Amazon SES)

- **Campaign studio** — author, schedule, and send campaigns through a verified SES identity. Per-campaign from-name, from-email, audience, recipient count, and optional scheduling.
- **Simulated SES send** — the `/api/campaigns/[id]/send` endpoint reproduces what a real `SES.SendBulkTemplatedEmail` flow produces: it generates realistic delivery, bounce, open, click, unsubscribe, and complaint events against the recipient list, using industry-typical funnel rates, then updates aggregate counters.
- **Per-campaign analytics** — 7-day engagement timeseries (sent / opened / clicked), a conversion funnel (Sent → Delivered → Opened → Clicked), top-clicked links, and a live event stream.
- **Cross-campaign analytics** — 14-day delivery trend, all-time event distribution, and a per-campaign comparison table with inline performance bars.
- **Delivery health KPIs** — total sent, delivery rate, bounce rate, open rate, click rate, unsubscribe rate, complaint rate, and active campaign count.
- **Status lifecycle** — `draft → scheduled → sending → sent`, with `paused` for halted sends. Filter tabs and full-text search across the campaign table.

### Security Audit

- **Autonomous account scan** — a single `POST /api/audit/run` simulates an agent enumerating IAM users/keys, S3 bucket policies, SES identities, EC2 security groups, and CloudTrail configuration, then normalizes the results into findings.
- **18 production-grade finding templates** covering the misconfigurations AWS Trusted Advisor / Security Hub flag in practice:
  - **IAM** — stale access keys (90+ days unused), MFA-less console users, `Action="*"` over-permissive policies, keys older than 1 year, root account keys.
  - **S3** — public-read bucket policies, missing default encryption, disabled versioning, missing lifecycle rules.
  - **SES** — quota above 80% utilization, missing DKIM signing, bounce rate above the 5% threshold.
  - **EC2** — security groups exposing SSH to `0.0.0.0/0`, unattached EBS volumes, previous-generation instance types.
  - **CloudTrail** — log file validation disabled, single-region trails.
  - **General** — no billing budget alert configured.
- **Severity & category filtering** — filter findings by severity (critical / high / medium / low / info) and category (IAM / S3 / SES / EC2 / CloudTrail / General).
- **Remediation actions** — each finding opens a detail drawer with the affected resource ARN, a plain-English description, and a recommended remediation. Mark **resolved** or **dismissed**; the open-findings count updates live.
- **Scan history** — every run is recorded with resource count, duration, and per-severity tallies.

### Platform

- **Dark-first design** — emerald/amber/teal palette (no default blue/indigo), with light/dark toggle via `next-themes`. Defaults to dark.
- **Fully responsive** — desktop sidebar collapses into a mobile drawer; all tables horizontally scroll; KPI grids reflow from 4 → 2 → 1 columns.
- **Sticky footer** — pinned to the viewport on short pages, pushed down naturally on long pages (no overlap, no floating gap).
- **Live polling** — dashboard stats, campaign list, and findings refresh on intervals; manual refresh after mutations.
- **Accessible** — semantic landmarks (`header` / `nav` / `main` / `footer`), keyboard-navigable controls, ARIA labels on icon buttons, focus rings throughout.
- **Toasts** — `sonner` notifications for every create / send / resolve / dismiss / save action.

---

## Screenshots

All screenshots are committed under [`/screenshots`](./screenshots):

| File | View |
|------|------|
| `dashboard.png` | Operations dashboard (KPIs + 14-day volume chart + event breakdown + recent campaigns + security posture) |
| `campaigns.png` | Campaigns list (filter tabs, search, status badges, per-row send/delete actions) |
| `campaign-detail.png` | Per-campaign detail drawer (engagement chart + funnel + top links + event stream) |
| `analytics.png` | Cross-campaign analytics (delivery trend + event distribution + comparison table) |
| `security-audit.png` | Security audit (scan summary, filtered findings list, scan history) |
| `settings.png` | AWS settings (connection status, region/key/SES-domain form, quota meter) |
| `mobile-dashboard.png` | Mobile layout (390px) — dashboard |
| `mobile-nav.png` | Mobile navigation drawer |

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 16** (App Router, Turbopack) | Latest React 19 + RSC + route handlers |
| Language | **TypeScript 5** (strict) | End-to-end type safety |
| Styling | **Tailwind CSS 4** + `tw-animate-css` | Utility-first, OKLCH color system |
| UI library | **shadcn/ui** (New York) + Radix primitives | Accessible, composable, themeable |
| Charts | **Recharts** | Declarative, responsive SVG charts |
| Database | **Prisma ORM** + SQLite | Zero-config local dev; swappable to Postgres |
| State | `@tanstack/react-query` + React `useState` | Server cache + local UI state |
| Forms | `react-hook-form` + `zod` | Type-safe validation |
| Icons | **lucide-react** | Consistent, tree-shakeable |
| Notifications | **sonner** | Lightweight toasts |
| Theming | **next-themes** | SSR-safe dark mode |
| Runtime | **Bun** | Fast installs, native TS execution for scripts |

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx                 # Root layout: fonts, ThemeProvider, Sonner
│   ├── page.tsx                   # Single route — renders <DashboardApp />
│   ├── globals.css                # OKLCH theme tokens + utilities (scrollbar, grid bg)
│   └── api/                       # Route handlers (force-dynamic, no caching)
│       ├── dashboard/             # Aggregate stats + 14-day trend (raw SQL)
│       ├── campaigns/             # CRUD + send + analytics
│       ├── audit/                 # Scan list + run + findings (filtered)
│       ├── settings/aws/          # Connection + SES identity + quota
│       └── seed/                  # Reset demo data
├── components/
│   ├── ui/                        # shadcn/ui primitives (48 components)
│   ├── theme-provider.tsx
│   └── dashboard/
│       ├── dashboard-app.tsx      # Shell: sidebar + topbar + section router
│       ├── sidebar.tsx            # Desktop nav + mobile drawer
│       ├── topbar.tsx             # Quota meter, AWS pill, theme toggle, Run Audit
│       ├── footer.tsx             # Sticky footer
│       ├── shared/                # KpiCard, StatusBadge, SectionHeader, EmptyState, api hooks
│       └── sections/
│           ├── dashboard-overview.tsx
│           ├── campaigns-view.tsx
│           ├── campaign-detail.tsx
│           ├── analytics-view.tsx
│           ├── security-audit-view.tsx
│           └── settings-view.tsx
├── lib/
│   ├── db.ts                      # Prisma client singleton
│   ├── types.ts                   # Shared domain types
│   ├── format.ts                  # Number / date / severity formatting
│   ├── mappers.ts                 # Campaign ORM → row mapper
│   ├── audit-engine.ts            # 18 AWS finding templates + selector
│   └── seed.ts                    # 8 sample campaigns + events + initial scan
└── hooks/                         # `use-mobile`, `use-toast`

prisma/
└── schema.prisma                  # Campaign, EmailEvent, AuditScan, AuditFinding, AwsSetting

scripts/
└── seed.ts                        # `bun scripts/seed.ts` to (re)populate the DB
```

### Single-route design

The entire user-facing app lives at `/`. Section navigation (`dashboard`, `campaigns`, `analytics`, `audit`, `settings`) is client-side state, deep-linkable via the URL hash (e.g. `/#audit`). This keeps the dev server on a single port and matches the "one-page SaaS console" mental model. The backend is a clean set of REST route handlers under `/api/*`.

### Performance

The dashboard and per-campaign analytics endpoints originally loaded every `EmailEvent` row into memory and bucketed in JS. For ~190K seeded events this took ~3s. Both were rewritten to use **`db.$queryRaw` with `GROUP BY date(timestamp), type`** aggregation, dropping response times to **~0.27s** (dashboard) and **~1.1s** (full campaign analytics).

---

## Getting Started

### Prerequisites

- **Node.js 20+** or **Bun** (recommended)
- An AWS account (optional — the app runs fully on simulated data out of the box)

### Install & run

```bash
# 1. Install dependencies
bun install            # or: npm install

# 2. Set up the database
bun run db:push        # pushes prisma/schema.prisma to SQLite (db/custom.db)
bun scripts/seed.ts    # seeds 8 campaigns + ~190K events + an initial audit scan

# 3. Start the dev server
bun run dev            # http://localhost:3000
```

The app boots into a dark-themed operations dashboard populated with sample Nimbus-branded campaigns. Open the **Security Audit** section to see the seeded findings, or hit **Run Audit** in the topbar to generate a fresh scan.

### Lint

```bash
bun run lint           # ESLint (Next.js + react-hooks rules)
```

---

## Project Structure

The codebase follows a **feature-grouped** layout under `src/components/dashboard/sections/`, with shared primitives in `src/components/dashboard/shared/` and pure domain logic in `src/lib/`. API route handlers are thin — they validate input, call Prisma, and return JSON. The simulated AWS logic (send funnel, audit findings) lives in `src/lib/audit-engine.ts` and the seed script, so swapping in the real AWS SDK later means replacing those two modules without touching the UI.

---

## API Reference

All routes are `force-dynamic` (no caching). Base URL: `http://localhost:3000`.

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard` | Aggregate KPIs, 14-day sent/delivered/bounced trend (SQL-aggregated), all-time event breakdown, open & critical finding counts, SES quota usage. Auto-seeds the DB on first call if empty. |

### Campaigns

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/campaigns?status=all\|draft\|scheduled\|sending\|sent\|paused` | List campaigns (newest first). |
| `POST` | `/api/campaigns` | Create a campaign. Body: `{ name, subject, fromName, fromEmail, audience, recipientCount, scheduledAt?, htmlContent? }`. Validates email format; sets status to `scheduled` if `scheduledAt` present, else `draft`. |
| `GET` | `/api/campaigns/:id` | Single campaign with computed rates. |
| `PATCH` | `/api/campaigns/:id` | Update fields / status. |
| `DELETE` | `/api/campaigns/:id` | Delete campaign + cascade events. |
| `POST` | `/api/campaigns/:id/send` | **Simulate an SES send.** Clears prior events, generates a realistic event funnel (sent / delivered / bounce / open / click / unsubscribe / complaint) using seeded RNG, batch-inserts events, updates aggregate counters, and increments the daily quota. |
| `GET` | `/api/campaigns/:id/analytics` | 7-day engagement timeseries (SQL-aggregated), conversion funnel, top 5 clicked links, and the 60 most recent events. |

### Security Audit

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/audit` | List scan history (newest first, max 20). |
| `POST` | `/api/audit/run` | Run a new scan. Generates a deterministic subset of the 18 finding templates, inserts them as `open`, and records the scan with per-severity counts. |
| `GET` | `/api/audit/findings?status=open&severity=critical&category=iam` | Filtered findings (all params optional; defaults to `status=open`). |
| `PATCH` | `/api/audit/findings/:id` | `{ status: "open" \| "resolved" \| "dismissed" }`. Sets `resolvedAt` when transitioning out of open. |

### AWS Settings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/settings/aws` | Current connection state, region, masked access key, SES domain, quota. |
| `PUT` | `/api/settings/aws` | Update settings. Validates region against the allow-list, validates access-key format (`AKIA` + 16 uppercase alphanumerics), validates SES domain shape. Supports `connect: true` / `disconnect: true` to toggle the connected state. The raw access key is **never stored** — only a masked representation (`AKIA••••••••QZ7H`). |

### Utilities

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/seed` | Wipe and re-seed all demo data. |

---

## Security Audit Engine

The audit engine (`src/lib/audit-engine.ts`) ships **18 finding templates** that mirror real AWS Trusted Advisor / Security Hub output. Each template carries:

- `category` — `iam` | `s3` | `ses` | `ec2` | `cloudtrail` | `general`
- `severity` — `critical` | `high` | `medium` | `low` | `info`
- `title` — short headline
- `description` — what's wrong and why it matters
- `resource` — the affected ARN
- `region` — AWS region (or `global`)
- `remediation` — a copy-pasteable fix (often a literal AWS CLI command)

A scan picks a deterministic subset (seeded by `Date.now() % 100000`) so repeat scans of the same "account state" are stable but varied. To wire this up to a real AWS account, replace the `generateFindings()` call in `/api/audit/run` with calls to the AWS SDK (`IAM.listAccessKeys`, `S3.getBucketPolicy`, `SES.getIdentityDkimAttributes`, `EC2.describeSecurityGroups`, `CloudTrail.describeTrails`) and normalize the results into the same finding shape — the entire UI layer stays untouched.

### Severity color system

| Severity | Badge | Dot |
|----------|-------|-----|
| Critical | red | `bg-red-500` |
| High | orange | `bg-orange-500` |
| Medium | amber | `bg-amber-500` |
| Low | teal | `bg-teal-500` |
| Info | slate | `bg-slate-400` |

---

## Data Model

Five Prisma models on SQLite (easily portable to Postgres by changing the `datasource` provider):

```prisma
model Campaign {
  id name subject fromName fromEmail status audience
  recipientCount sentCount deliveredCount bounceCount
  openCount clickCount unsubscribeCount complaintCount
  htmlContent scheduledAt createdAt updatedAt
  events EmailEvent[]
}

model EmailEvent {
  id campaignId type        // sent | delivered | bounce | open | click | unsubscribe | complaint
  recipient detail timestamp
  campaign Campaign @relation(...)
  @@index([campaignId, type])
  @@index([timestamp])
}

model AuditScan {
  id status accountsScanned resourcesScanned
  findingsCount criticalCount highCount mediumCount lowCount
  startedAt completedAt
  findings AuditFinding[]
}

model AuditFinding {
  id scanId category severity title description
  resource region remediation status    // open | resolved | dismissed
  createdAt resolvedAt
  scan AuditScan @relation(...)
  @@index([scanId]) @@index([severity]) @@index([status])
}

model AwsSetting {
  id @id @default("singleton")   // enforced singleton row
  region accountAlias accessKeyMasked
  sesVerifiedDomain sesSendingEnabled
  dailySendingLimit dailyUsed connected lastSyncAt updatedAt
}
```

Indexes are tuned for the actual query patterns: event lookup by `(campaignId, type)`, finding filtering by `severity` / `status`, and trend aggregation by `timestamp`.

---

## Configuration

### Environment

A single variable is required (already in `.env`):

```env
DATABASE_URL="file:/home/z/my-project/db/custom.db"
```

The SQLite file is gitignored and regenerated by the seed script, so a fresh clone is a fresh database.

### Connecting a real AWS account

The **AWS Settings** view lets you configure:

- **Region** — picked from the 9 most common AWS regions.
- **Account alias** — friendly label shown in the sidebar.
- **Access key ID** — validated against the `AKIA[0-9A-Z]{16}` format; only a masked version is persisted.
- **SES verified domain** — the `From` identity Nimbus will send through.
- **Daily sending limit** — your SES quota ceiling, used for the topbar meter.
- **SES sending enabled** — master switch.

> **Note:** This build simulates SES sends and AWS audits locally so it runs without cloud credentials. To make it live, swap the bodies of `POST /api/campaigns/:id/send` and `POST /api/audit/run` for AWS SDK calls — the API contract and UI stay identical.

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start the dev server on port 3000 (Turbopack). |
| `bun run lint` | ESLint with Next.js + react-hooks rules. |
| `bun run db:push` | Push `prisma/schema.prisma` to the SQLite file. |
| `bun run db:generate` | Regenerate the Prisma client. |
| `bun run db:migrate` | Create a migration (dev). |
| `bun run db:reset` | Reset migrations (dev). |
| `bun scripts/seed.ts` | Wipe and re-seed all demo data (8 campaigns, ~190K events, 1 audit scan with 18 findings). |

---

## Roadmap

- **Real AWS integration** — swap the simulated send + audit for AWS SDK calls behind the existing API contract.
- **Webhook ingestion** — receive real SES SNS event notifications into the `EmailEvent` table.
- **Scheduled scan runner** — cron-triggered audits with email/Slack alerts on new critical findings.
- **Multi-account** — support several AWS accounts under one Nimbus workspace.
- **Template editor** — rich HTML email authoring with live preview (the `htmlContent` field is already in the schema).
- **Suppression list management** — auto-suppress hard bounces and complaints.
- **Postgres adapter** — flip the Prisma `datasource` provider for production deployments.

---

## License

MIT — see [`LICENSE`](./LICENSE) (or the MIT license terms if no file is present).

---

Built as a single-route Next.js 16 application. The entire user-facing experience lives at `/`; everything else is an API route handler.
