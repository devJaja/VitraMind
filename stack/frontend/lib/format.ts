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
