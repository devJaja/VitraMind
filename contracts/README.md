# VitraMind Smart Contracts

Solidity contracts powering VitraMind's on-chain proof layer on Celo.

## Contracts

| Contract | Description |
|---|---|
| `ProfileAnchor` | Stores a keccak256 identity commitment per user |
| `ProofRegistry` | Append-only registry of hashed logs, insights, and streaks |
| `GrowthNFT` | Soulbound ERC721 that evolves with user growth (oracle-controlled) |
| `RewardsEngine` | Distributes cUSD rewards, points, and badges via oracle |
| `StreakVerifier` | Anchors daily streak proofs with 23h cooldown enforcement |
| `MetadataRenderer` | Resolves dynamic IPFS metadata URIs per growth tier |
| `AnalyticsRegistry` | Privacy-preserving weekly/monthly analytics digest anchoring |
| `ZKStreakVerifier` | Groth16 ZK proof verification for streak milestones (nullifier-protected) |
| `IPFSExportRegistry` | Anchors encrypted IPFS export CIDs with content hash verification |
| `GrowthIdentity` | Cross-app composable identity with commitment publishing and app registry |
| `WellnessProtocol` | Composable wellness protocol registry with opt-in and progress anchoring |

## Architecture

```
Serverpod Backend (oracle)
        │
        ├── submitProof()     → ProofRegistry
        ├── anchorProfile()   → ProfileAnchor  (called by user directly)
        ├── mint/updateGrowth → GrowthNFT
        └── rewardCUSD/badge  → RewardsEngine
```

Raw data never touches the chain — only keccak256 commitments.

## Setup

```bash
npm install
cp .env.example .env   # fill in PRIVATE_KEY, CUSD_ADDRESS, ORACLE_ADDRESS
```

## Commands

```bash
npm run compile          # compile contracts
npm test                 # run test suite
npm run deploy:alfajores # deploy to Celo testnet
npm run deploy:celo      # deploy to Celo mainnet
```

## Networks

| Network | Chain ID | cUSD |
|---|---|---|
| Alfajores (testnet) | 44787 | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |
| Celo (mainnet) | 42220 | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
