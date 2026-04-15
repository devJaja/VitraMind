/**
 * Contract addresses per network.
 * Update after deployment — run `npm run deploy:alfajores` or `npm run deploy:celo`
 * in the contracts/ directory and copy addresses from deployments.<network>.json
 */
export const CONTRACTS = {
  // Celo Alfajores testnet (chainId 44787)
  alfajores: {
    ProfileAnchor:    "" as `0x${string}`,
    ProofRegistry:    "" as `0x${string}`,
    GrowthNFT:        "" as `0x${string}`,
    RewardsEngine:    "" as `0x${string}`,
    StreakVerifier:   "" as `0x${string}`,
    MetadataRenderer: "" as `0x${string}`,
    AnalyticsRegistry:"" as `0x${string}`,
    ZKStreakVerifier:  "" as `0x${string}`,
    IPFSExportRegistry:"" as `0x${string}`,
    GrowthIdentity:   "" as `0x${string}`,
    WellnessProtocol: "" as `0x${string}`,
  },
  // Celo mainnet (chainId 42220)
  celo: {
    ProfileAnchor:    "" as `0x${string}`,
    ProofRegistry:    "" as `0x${string}`,
    GrowthNFT:        "" as `0x${string}`,
    RewardsEngine:    "" as `0x${string}`,
    StreakVerifier:   "" as `0x${string}`,
    MetadataRenderer: "" as `0x${string}`,
    AnalyticsRegistry:"" as `0x${string}`,
    ZKStreakVerifier:  "" as `0x${string}`,
    IPFSExportRegistry:"" as `0x${string}`,
    GrowthIdentity:   "" as `0x${string}`,
    WellnessProtocol: "" as `0x${string}`,
  },
} as const;
