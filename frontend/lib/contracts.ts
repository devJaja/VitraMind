/**
 * Contract addresses per network.
 * Update after deployment — run `npm run deploy:alfajores` or `npm run deploy:celo`
 * in the contracts/ directory and copy addresses from deployments.<network>.json
 *
 * Use `undefined` (not empty string) so `!!address` guards in hooks work correctly.
 */
export const CONTRACTS: Record<string, Record<string, `0x${string}` | undefined>> = {
  // Celo Alfajores testnet (chainId 44787)
  alfajores: {
    ProfileAnchor:     undefined,
    ProofRegistry:     undefined,
    GrowthNFT:         undefined,
    RewardsEngine:     undefined,
    StreakVerifier:     undefined,
    MetadataRenderer:  undefined,
    AnalyticsRegistry: undefined,
    ZKStreakVerifier:   undefined,
    IPFSExportRegistry:undefined,
    GrowthIdentity:    undefined,
    WellnessProtocol:  undefined,
  },
  // Celo mainnet (chainId 42220)
  celo: {
    ProfileAnchor:     undefined,
    ProofRegistry:     undefined,
    GrowthNFT:         undefined,
    RewardsEngine:     undefined,
    StreakVerifier:     undefined,
    MetadataRenderer:  undefined,
    AnalyticsRegistry: undefined,
    ZKStreakVerifier:   undefined,
    IPFSExportRegistry:undefined,
    GrowthIdentity:    undefined,
    WellnessProtocol:  undefined,
  },
};
