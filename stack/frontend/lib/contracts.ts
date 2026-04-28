/**
 * Stacks contract identifiers.
 * Format: <deployer-STX-address>.<contract-name>
 * Update DEPLOYER after running deploy-stacks.js.
 */

export const DEPLOYER =
  process.env.NEXT_PUBLIC_STACKS_DEPLOYER ?? "ST000000000000000000002AMW42H";

export const CONTRACTS = {
  profileAnchor:      `${DEPLOYER}.profile-anchor`,
  proofRegistry:      `${DEPLOYER}.proof-registry`,
  streakVerifier:     `${DEPLOYER}.streak-verifier`,
  analyticsRegistry:  `${DEPLOYER}.analytics-registry`,
  ipfsExportRegistry: `${DEPLOYER}.ipfs-export-registry`,
  growthIdentity:     `${DEPLOYER}.growth-identity`,
  wellnessProtocol:   `${DEPLOYER}.wellness-protocol`,
  goalTracker:        `${DEPLOYER}.goal-tracker`,
  moodOracle:         `${DEPLOYER}.mood-oracle`,
  rewardVault:        `${DEPLOYER}.reward-vault`,
  leaderboard:        `${DEPLOYER}.leaderboard`,
  notificationRegistry: `${DEPLOYER}.notification-registry`,
  habitCommitment:    `${DEPLOYER}.habit-commitment`,
} as const;

export const NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK ?? "testnet";

export const EXPLORER_BASE =
  NETWORK === "mainnet"
    ? "https://explorer.hiro.so"
    : "https://explorer.hiro.so/?chain=testnet";

export function explorerTx(txid: string) {
  return `${EXPLORER_BASE}/txid/${txid}`;
}
