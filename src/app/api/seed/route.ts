import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await seedDatabase({ reset: true });
  return NextResponse.json(result);
}
