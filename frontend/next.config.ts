import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // MiniPay runs in a sandboxed browser — disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
