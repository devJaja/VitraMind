/**
 * Contract addresses per network.
 * Mainnet addresses from deployments.celo.json (deployed 2026-04-18).
 * Alfajores addresses: run `npm run deploy:alfajores` and update below.
 */
export const CONTRACTS: Record<string, Record<string, `0x${string}` | undefined>> = {
  // Celo Alfajores testnet (chainId 44787)
  alfajores: {
    ProfileAnchor:      undefined,
    ProofRegistry:      undefined,
    GrowthNFT:          undefined,
    RewardsEngine:      undefined,
    StreakVerifier:     undefined,
    MetadataRenderer:   undefined,
    AnalyticsRegistry:  undefined,
    ZKStreakVerifier:   undefined,
    IPFSExportRegistry: undefined,
    GrowthIdentity:     undefined,
    WellnessProtocol:   undefined,
  },
  // Celo mainnet (chainId 42220)
  celo: {
    ProfileAnchor:      "0x5930dD01989847697dB0F4240890F78eD6AC4577",
    ProofRegistry:      "0x4501199B23d6f29ebe5f3af55118708cFF8e6f2b",
    MetadataRenderer:   "0x3c40e69d858d83eD4712d532f0b897640B038473",
    GrowthNFT:          "0xB225effE84D95B4874842c94f04c8EA6183e39c1",
    StreakVerifier:     "0xc55D27d217cd6ABfa666bdd7CD29Aa2B7b2977d4",
    AnalyticsRegistry:  "0xA675088563DfB9f280140eFa297D878649159256",
    RewardsEngine:      "0x4e0dc019d7Ca54A31b9A9929d394AEf3E1396557",
    ZKStreakVerifier:   "0xC3333e5f5c29B624B40fc8E7D3F70Ec71CED558B",
    IPFSExportRegistry: "0x414A8B156808479B741Df1C9EF5E0Ea5208Fd80A",
    GrowthIdentity:     "0xB0e26442A400931972821351f01EfE1fF91C4d0A",
    WellnessProtocol:   "0xD8Ad321862084080732D745335f6370AddF3F380",
  },
};
