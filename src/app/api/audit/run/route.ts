import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateFindings } from "@/lib/audit-engine";

export const dynamic = "force-dynamic";

// Simulates an autonomous agent scanning the connected AWS account. In
// production this would enumerate IAM users/keys, S3 bucket policies,
// SES identities, EC2 security groups, and CloudTrail config via the AWS
// SDK, then normalize the results into findings.
export async function POST() {
  const startedAt = new Date();
  const scan = await db.auditScan.create({
    data: {
      status: "running",
      accountsScanned: 1,
      startedAt,
    },
  });

  // Simulate scan latency deterministically
  const findings = generateFindings(Date.now() % 100000);
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) counts[f.severity as keyof typeof counts]++;

  const completedAt = new Date(startedAt.getTime() + 42000);

  await db.auditFinding.createMany({
    data: findings.map((f) => ({
      scanId: scan.id,
      category: f.category,
      severity: f.severity,
      title: f.title,
      description: f.description,
      resource: f.resource,
      region: f.region,
      remediation: f.remediation,
      status: "open",
      createdAt: completedAt,
    })),
  });

  const updated = await db.auditScan.update({
    where: { id: scan.id },
    data: {
      status: "completed",
      resourcesScanned: 280 + Math.floor(Math.random() * 80),
      findingsCount: findings.length,
      criticalCount: counts.critical,
      highCount: counts.high,
      mediumCount: counts.medium,
      lowCount: counts.low,
      completedAt,
    },
  });

  return NextResponse.json({
    ...updated,
    startedAt: updated.startedAt.toISOString(),
    completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
  });
}
