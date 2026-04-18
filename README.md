<div align="center">

# VitraMind

**A Celo Mini App for Personal Growth & Verifiable Self-Reflection**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-363636?logo=solidity)](contracts/)
[![Built on Celo](https://img.shields.io/badge/Built%20on-Celo-FCFF52?logo=celo&logoColor=000)](https://celo.org)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-000?logo=next.js)](frontend/)
[![MiniPay](https://img.shields.io/badge/MiniPay-Compatible-FCFF52)](frontend/)

VitraMind is a privacy-first personal growth companion that helps users track habits, moods, and reflections — while anchoring cryptographic proofs of progress on the Celo blockchain.

Your growth is yours. Your data stays private. Your progress is verifiable.

</div>

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Features](#features)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

VitraMind combines daily journaling, AI-powered behavioral insights, and lightweight blockchain primitives into a single mobile-first experience.

Unlike traditional wellness apps, VitraMind never uploads raw personal data on-chain. Instead, it stores **cryptographic commitments** — keccak256 hashes of logs, insights, and milestones — giving users a tamper-proof, verifiable record of their growth without sacrificing privacy.

---

## How It Works

```
User logs mood, habits, and reflections
            │
            ▼
  Serverpod backend processes entry
            │
            ▼
  Google Gemini generates AI insights
            │
            ▼
  System hashes log + insights locally
            │
            ▼
  Celo contracts store proof commitments
            │
            ▼
  GrowthNFT evolves · Rewards distributed
```

Raw data never leaves the device or encrypted backend storage. Only hashes touch Celo.

---

## Features

### Daily Logging
- Mood tracking (1–5 scale)
- Custom habit tracking
- Free-text reflections
- Calendar view with past/future date support

### AI Insights — powered by Google Gemini
Generated automatically after 3+ log entries:
- 30-day behavioral predictions
- Habit improvement suggestions
- Pattern analysis across mood and habits
- Motivational letter from your future self

All AI outputs are hashed and anchored on-chain for verifiability.

### On-Chain Proof Layer

| What goes on-chain | What stays off-chain |
|---|---|
| Hash of daily log | Raw journal text |
| Hash of AI insights | Mood scores |
| Habit streak proofs | Personal notes |
| Achievement events | Any sensitive data |
| Growth NFT metadata URI | — |

### Privacy by Design
- All personal data remains on-device or in encrypted backend storage
- On-chain entries are commitments only — no PII ever published
- Optional encrypted IPFS export

### Dashboard & Analytics
- Mood trend charts
- Habit consistency heatmaps
- Insight history timeline
- Growth progress overview

---

## Architecture

```
┌─────────────────────────────────┐
│        Flutter Mini App         │  ← Celo Mini App SDK
└────────────────┬────────────────┘
                 │ REST / WebSocket
┌────────────────▼────────────────┐
│       Serverpod Backend         │  ← Auth (JWT) · AI orchestration
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌───────▼──────────┐
│ Google Gemini│  │  Proof Generator  │  ← keccak256 hashing
└──────────────┘  └───────┬──────────┘
                          │ on-chain calls
          ┌───────────────┼───────────────┐
          │               │               │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼──────────┐
   │ProfileAnchor│ │ProofRegistry│ │GrowthNFT       │
   └─────────────┘ └─────────────┘ │RewardsEngine   │
                                   └────────────────┘
```

---

## Smart Contracts

All contracts are deployed on Celo. Source: [`contracts/src/`](contracts/src/)

### `ProfileAnchor.sol`
Stores a single keccak256 identity commitment per address. Users anchor a hash of their off-chain profile — no personal data on-chain.

```solidity
function anchorProfile(bytes32 hash) external;
function hasProfile(address user) external view returns (bool);
```

### `ProofRegistry.sol`
Append-only, tamper-proof registry of hashed proofs. Supports four proof types: `LOG`, `INSIGHT`, `STREAK`, `ACHIEVEMENT`. O(1) duplicate detection and verification via a secondary mapping.

```solidity
function submitProof(bytes32 hash, ProofType proofType) external;
function verifyProof(address user, bytes32 hash) external view returns (bool);
```

### `GrowthNFT.sol`
Soulbound ERC-721 (non-transferable) that evolves as the user grows. One NFT per address. Metadata URIs are resolved dynamically via `MetadataRenderer` based on the user's current growth tier.

```solidity
function mint(address user, string calldata metadataURI) external; // oracle only
function updateGrowth(address user, uint8 newLevel, uint32 streakDays, uint32 totalLogs, string calldata metadataURI) external;
function setRenderer(address _renderer) external; // owner only
```

### `RewardsEngine.sol`
Distributes cUSD rewards, points, and badges. Streak milestones (7 / 30 / 100 days) trigger automatic tiered cUSD payouts. Owner pre-funds the contract; oracle triggers payouts after verifying off-chain proofs.

```solidity
function rewardCUSD(address user, uint256 amount) external;
function rewardStreak(address user, uint32 streakDays) external; // auto-tiered
function awardPoints(address user, uint256 points, string calldata reason) external;
function awardBadge(address user, uint256 badgeId) external;
```

### `StreakVerifier.sol`
Anchors daily habit streak proofs on-chain with 23-hour cooldown enforcement. Prevents double-counting while keeping raw habit data off-chain.

```solidity
function anchorStreak(address user, bytes32 proofHash, uint32 currentStreak) external;
function latestStreak(address user) external view returns (StreakEntry memory);
```

### `MetadataRenderer.sol`
Resolves deterministic IPFS metadata URIs for GrowthNFT across 5 growth tiers: Seedling (1–10), Sprout (11–25), Bloom (26–50), Flourish (51–75), Transcendent (76–100).

```solidity
function setTierCID(uint8 tier, string calldata cid) external; // owner only
function tokenURI(uint8 level, uint256 tokenId) external view returns (string memory);
```

### `AnalyticsRegistry.sol`
Privacy-preserving on-chain analytics layer. Stores weekly and monthly digest hashes of habit/mood analytics — no raw data ever on-chain.

```solidity
function anchorSnapshot(address user, bytes32 digestHash, uint8 period) external;
function latestSnapshot(address user, uint8 period) external view returns (Snapshot memory);
```

### `ZKStreakVerifier.sol`
Verifies Groth16 zero-knowledge proofs that a user's streak meets a threshold — without revealing the actual streak count. Nullifiers prevent proof replay. The verifier contract is upgradeable.

```solidity
function proveStreak(uint256[2] pA, uint256[2][2] pB, uint256[2] pC, uint256[] pubSignals) external;
function hasProvenStreak(address user, uint256 minStreak) external view returns (bool);
```

### `IPFSExportRegistry.sol`
Anchors encrypted IPFS export CIDs on-chain. Data is encrypted client-side before pinning; only the CID and a keccak256 content hash are stored. Supports FULL, LOGS, INSIGHTS, and ANALYTICS export types.

```solidity
function anchorExport(string calldata cid, bytes32 contentHash, ExportType exportType) external;
function verifyExport(address user, bytes32 contentHash) external view returns (bool);
```

### `GrowthIdentity.sol`
Cross-app composable identity layer. Users publish a signed commitment of their growth credentials; third-party apps verify it without accessing raw data. Includes an on-chain app registry.

```solidity
function publishIdentity(bytes32 commitment, uint8 growthLevel) external;
function hasActiveIdentity(address user) external view returns (bool);
function registerApp(string calldata name, address appAddress) external returns (uint256 appId);
```

### `WellnessProtocol.sol`
Composable wellness protocol registry. Developers register IPFS-schema-backed programs; users opt in and commit progress hashes. Creator or owner can deactivate protocols.

```solidity
function registerProtocol(string calldata name, string calldata schemaCID) external returns (uint256);
function optIn(uint256 protocolId) external;
function commitProgress(uint256 protocolId, bytes32 commitmentHash) external;
```

**Network addresses**

| Network | Chain ID | cUSD |
|---|---|---|
| Alfajores (testnet) | 44787 | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |
| Celo (mainnet) | 42220 | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Flutter · Celo Mini App SDK |
| Backend | Serverpod (Dart) |
| Authentication | Email / Password → JWT |
| AI | Google Gemini |
| Smart Contracts | Solidity 0.8.27 · OpenZeppelin v5 |
| Blockchain | Celo (EVM-compatible) |
| Storage | On-device · Optional encrypted IPFS |
| Contract Tooling | Hardhat · ethers.js |

---

## Getting Started

### Prerequisites
- Flutter SDK ≥ 3.x
- Dart SDK ≥ 3.x
- Node.js ≥ 18
- A Celo wallet with testnet CELO (get from [Alfajores faucet](https://faucet.celo.org))

### 1. Clone the repository

```bash
git clone https://github.com/devJaja/VitraMind.git
cd VitraMind
```

### 2. Configure environment variables

```bash
cp contracts/.env.example contracts/.env
```

```env
PRIVATE_KEY=0x...
CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1   # Alfajores
ORACLE_ADDRESS=0x...                                        # Your backend signer
```

### 3. Deploy contracts

```bash
cd contracts
npm install
npm run deploy:alfajores   # testnet
# npm run deploy:celo      # mainnet
```

### 4. Install Flutter dependencies

```bash
cd ../frontend
flutter pub get
```

### 5. Start the Serverpod backend

```bash
dart bin/main.dart
```

### 6. Run the app

```bash
flutter run
```

---

## Testing

**Smart contracts** — 95 tests across all 11 contracts

```bash
cd contracts
npm test
```

**Flutter widgets**

```bash
cd frontend
flutter test
```

**Backend**

```bash
dart test
```

---

## Roadmap

**Phase 1 — MVP** *(current)*
- [x] Daily mood and habit logging
- [x] AI insights via Gemini
- [x] Celo proof registry
- [x] Smart contract suite

**Phase 2 — Growth Layer** *(current)*
- [x] Habit analytics dashboard data layer (`AnalyticsRegistry`)
- [x] GrowthNFT with dynamic IPFS metadata (`MetadataRenderer`)
- [x] Streak proof anchoring (`StreakVerifier`)
- [x] cUSD reward distribution with milestone tiers

**Phase 3 — Advanced Privacy** *(current)*
- [x] Zero-knowledge proofs for streak verification (`ZKStreakVerifier`)
- [x] Encrypted IPFS data export (`IPFSExportRegistry`)
- [x] Cross-app growth identity (`GrowthIdentity`)
- [x] Composable wellness protocols (`WellnessProtocol`)

---

## License

[MIT](LICENSE) — free to build, remix, and innovate.
