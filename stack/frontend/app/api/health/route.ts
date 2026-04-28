import { NextRequest, NextResponse } from "next/server";

// Health check endpoint — used by monitoring and uptime services
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "ok",
    service: "VitraMind API",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
    features: {
      gemini: !!process.env.GEMINI_API_KEY,
      stacks: !!process.env.NEXT_PUBLIC_STACKS_DEPLOYER,
    },
  });
}
