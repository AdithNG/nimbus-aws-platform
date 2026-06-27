import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { maskAccessKey } from "@/lib/format";
import type { AwsSettingsRow } from "@/lib/types";
import { AWS_REGIONS } from "@/lib/audit-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  let aws = await db.awsSetting.findUnique({ where: { id: "singleton" } });
  if (!aws) {
    aws = await db.awsSetting.create({ data: { id: "singleton" } });
  }
  const row: AwsSettingsRow = {
    region: aws.region,
    accountAlias: aws.accountAlias,
    accessKeyMasked: aws.accessKeyMasked,
    sesVerifiedDomain: aws.sesVerifiedDomain,
    sesSendingEnabled: aws.sesSendingEnabled,
    dailySendingLimit: aws.dailySendingLimit,
    dailyUsed: aws.dailyUsed,
    connected: aws.connected,
    lastSyncAt: aws.lastSyncAt ? aws.lastSyncAt.toISOString() : null,
  };
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // Validate region if provided
  if (body.region && !AWS_REGIONS.includes(body.region)) {
    return NextResponse.json({ error: "Invalid region" }, { status: 400 });
  }
  // Validate access key format (AKIA + 16 chars) when a new raw key is given
  let maskedKey: string | undefined;
  if (typeof body.accessKey === "string" && body.accessKey.trim()) {
    const key = body.accessKey.trim();
    if (!/^AKIA[0-9A-Z]{16}$/.test(key)) {
      return NextResponse.json(
        { error: "Access key must match AKIA followed by 16 uppercase alphanumeric characters" },
        { status: 400 }
      );
    }
    maskedKey = maskAccessKey(key);
  }

  // Validate SES domain if provided
  let sesDomain: string | null | undefined;
  if (body.sesVerifiedDomain !== undefined) {
    sesDomain = body.sesVerifiedDomain
      ? String(body.sesVerifiedDomain).trim()
      : null;
    if (sesDomain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(sesDomain)) {
      return NextResponse.json(
        { error: "Invalid SES domain format" },
        { status: 400 }
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (body.region) data.region = body.region;
  if (body.accountAlias !== undefined)
    data.accountAlias = String(body.accountAlias || "production");
  if (maskedKey) data.accessKeyMasked = maskedKey;
  if (sesDomain !== undefined) data.sesVerifiedDomain = sesDomain;
  if (typeof body.sesSendingEnabled === "boolean")
    data.sesSendingEnabled = body.sesSendingEnabled;
  if (body.dailySendingLimit !== undefined)
    data.dailySendingLimit = Math.max(1, Number(body.dailySendingLimit) || 1);
  if (body.connect) {
    data.connected = true;
    data.lastSyncAt = new Date();
  }
  if (body.disconnect) data.connected = false;

  const updated = await db.awsSetting.upsert({
    where: { id: "singleton" },
    update: data,
    create: {
      id: "singleton",
      region: body.region ?? "us-east-1",
      accountAlias: body.accountAlias ?? "production",
      accessKeyMasked: maskedKey,
      sesVerifiedDomain: sesDomain ?? null,
      sesSendingEnabled: body.sesSendingEnabled ?? false,
      dailySendingLimit: body.dailySendingLimit ?? 50000,
      connected: body.connect ?? false,
      lastSyncAt: body.connect ? new Date() : null,
    },
  });

  const row: AwsSettingsRow = {
    region: updated.region,
    accountAlias: updated.accountAlias,
    accessKeyMasked: updated.accessKeyMasked,
    sesVerifiedDomain: updated.sesVerifiedDomain,
    sesSendingEnabled: updated.sesSendingEnabled,
    dailySendingLimit: updated.dailySendingLimit,
    dailyUsed: updated.dailyUsed,
    connected: updated.connected,
    lastSyncAt: updated.lastSyncAt ? updated.lastSyncAt.toISOString() : null,
  };
  return NextResponse.json(row);
}
