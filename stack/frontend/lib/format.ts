/**
 * Truncates an Ethereum address for display.
 * e.g. 0x1234...5678
 */
export function shortAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

/**
 * Formats a Unix timestamp (seconds) to a human-readable date string.
 */
export function formatTimestamp(ts: bigint | number): string {
  return new Date(Number(ts) * 1000).toLocaleString();
}

/**
 * Formats a bigint wei value to a human-readable cUSD string.
 * e.g. 1500000000000000000n → "1.50 cUSD"
 */
export function formatCUSD(wei: bigint, decimals = 2): string {
  return `${(Number(wei) / 1e18).toFixed(decimals)} cUSD`;
}

/**
 * Returns a growth tier label for a given level (1-100).
 */
export function growthTierLabel(level: number): string {
  if (level >= 76) return "🌟 Transcendent";
  if (level >= 51) return "🌸 Flourish";
  if (level >= 26) return "🌺 Bloom";
  if (level >= 11) return "🌿 Sprout";
  return "🌱 Seedling";
}

/** Returns the tier number (1-5) for a given level */
export function growthTierNumber(level: number): number {
  if (level >= 76) return 5;
  if (level >= 51) return 4;
  if (level >= 26) return 3;
  if (level >= 11) return 2;
  return 1;
}

/** Formats micro-STX to STX string */
export function microStxToStx(micro: number | bigint, decimals = 2): string {
  return `${(Number(micro) / 1_000_000).toFixed(decimals)} STX`;
}

/** Formats a Stacks block height to an approximate date string */
export function blockToApproxDate(block: number): string {
  // Stacks mainnet genesis ~Jan 2021, ~10 min/block
  const GENESIS_MS = 1610000000000;
  const approx = new Date(GENESIS_MS + block * 10 * 60 * 1000);
  return approx.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Truncates a Stacks address for display */
export function shortStxAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}
