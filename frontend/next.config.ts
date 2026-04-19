import type { NextConfig } from "next";

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY is not set — AI insights will be unavailable. See frontend/.env.local.example");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Expose chain IDs to client without leaking secrets
  env: {
    NEXT_PUBLIC_CELO_CHAIN_ID:     "42220",
    NEXT_PUBLIC_ALFAJORES_CHAIN_ID: "44787",
    NEXT_PUBLIC_APP_VERSION:        "1.0.0",
  },
};

export default nextConfig;
