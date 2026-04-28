# Changelog

All notable changes to VitraMind are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — Phase 4

### Added
- **GoalTracker** Clarity contract — privacy-first on-chain goal commitments with status updates
- **MoodOracle** Clarity contract — aggregated weekly mood digest anchoring (no raw scores on-chain)
- **RewardVault** Clarity contract — STX milestone rewards (7/30/100-day streaks) with claim pattern
- **Leaderboard** Clarity contract — opt-in privacy-preserving streak rankings with alias system
- `deploy-phase4.js` — deploy script for all Phase-4 Clarity contracts
- `interact-stacks.js` — 113-interaction Stacks Bitcoin mainnet script covering all 7 contracts
- `useGoalTracker`, `useLeaderboard`, `useRewardVault` frontend hooks
- `GoalTrackerCard` component — commit/update/complete goals with AI coaching
- `LeaderboardCard` + `RewardVaultCard` components
- `OnboardingFlow` — 6-step first-run walkthrough
- `NotificationsPanel` — streak milestones, AI unlock, mood alerts
- `ShareCard` — copy-to-clipboard growth stats card
- `SettingsPanel` — theme, font size, display toggles, data management
- `GrowthReportCard` — AI-powered full journey analysis via `/api/report`
- `/api/goals` route — AI goal coaching via Gemini
- `/api/report` route — AI growth report generation
- `/api/analytics` route — analytics schema endpoint
- Enhanced `Dashboard` — best streak, words written, growth tier
- Enhanced `MoodChart` — distribution view alongside trend view
- Enhanced `HabitHeatmap` — top habits frequency bar chart
- Enhanced `ProofsTab` — local proof history with tx links
- Enhanced `Header` — notifications bell with unread badge, settings button
- New `logStorage` utilities: `getBestStreak`, `getHabitFrequency`, `getMoodDistribution`, `getTotalReflectionWords`
- New `format` utilities: `growthTierNumber`, `microStxToStx`, `blockToApproxDate`, `shortStxAddress`
- Root `.gitignore` — excludes `.env`, keys, build artifacts
- `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`

### Changed
- Main page now has 13 tabs: Log, AI, Report, History, Proofs, Goals, Profile, Streak, Identity, Wellness, Export, Rewards, Share
- `contracts/package.json` — added `deploy:phase4`, `interact:stacks`, `interact:celo` scripts
- `Clarinet.toml` — registered all 4 Phase-4 contracts

---

## [Phase 3] — Advanced Privacy

### Added
- `ZKStreakVerifier.sol` — Groth16 ZK proof verification for streak thresholds
- `IPFSExportRegistry.sol` — encrypted IPFS export CID anchoring
- `GrowthIdentity.sol` — cross-app composable growth identity
- `WellnessProtocol.sol` — composable wellness protocol registry
- Stacks Clarity equivalents for all Phase-3 contracts
- ZK circuit (`StreakThreshold.circom`) and trusted setup keys

---

## [Phase 2] — Growth Layer

### Added
- `AnalyticsRegistry.sol` — weekly/monthly digest hash anchoring
- `MetadataRenderer.sol` — dynamic IPFS metadata for GrowthNFT tiers
- `StreakVerifier.sol` — 23-hour cooldown streak proof anchoring
- `RewardsEngine.sol` — cUSD milestone reward distribution
- `GrowthNFT.sol` — soulbound ERC-721 with 5 growth tiers

---

## [Phase 1] — MVP

### Added
- `ProfileAnchor.sol` — identity commitment registry
- `ProofRegistry.sol` — append-only proof registry (LOG/INSIGHT/STREAK/ACHIEVEMENT)
- Next.js frontend with Stacks wallet integration
- Google Gemini AI insights (full_insight, quick_check, weekly_summary, ask)
- Local-first journal storage with streak and mood analytics
- Celo mainnet deployment of all Phase-1 contracts
