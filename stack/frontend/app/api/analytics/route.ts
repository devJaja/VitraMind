import { NextRequest, NextResponse } from "next/server";
import { getLogs } from "@/lib/logStorage";

// GET /api/analytics?address=SP...
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  // This runs server-side — we return a schema; actual data is computed client-side
  // and only the digest hash is anchored on-chain via AnalyticsRegistry
  return NextResponse.json({
    message: "Analytics are computed client-side for privacy. Use the AnalyticsRegistry contract to anchor digest hashes.",
    periods: ["weekly", "monthly"],
    contract: "analytics-registry",
  });
}
