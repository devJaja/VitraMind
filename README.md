# VitraMind
 A Celo Mini App for Personal Growth & Verifiable Self-Reflection

VitraMind is a Celo-powered personal growth companion that helps users track their habits, moods, reflections, and life patterns — while anchoring verifiable proofs of progress on-chain.

Think of it as your decentralized mirror:
A place where your growth is yours, private, secure, and cryptographically proven.

Built as a Celo Mini App, VitraMind combines elegant UX, AI-powered insights, and lightweight blockchain primitives to create an intelligent, self-reflective experience that respects user privacy.

📌 Table of Contents
🌿 Overview
🎯 Philosophy
✨ Features
🔐 Why Celo?
🏗️ Architecture
🧱 Smart Contract Modules
📱 Mini App Flow
🚀 Roadmap
🛠️ Tech Stack
⚙️ Setup & Installation
🧪 Testing
📄 License
🌿 Overview

VitraMind is a self-improvement companion that blends:

✍️ Daily journaling
😊 Mood & habit tracking
🤖 AI insights powered by Google Gemini
🔗 Celo blockchain proofs of progress
🪪 Verifiable growth identity (optional NFT layer)

Unlike traditional apps, VitraMind does not upload your raw data on-chain.
Instead, it stores cryptographic proofs (hashes, commitments, and behavior milestones).

This lets users:

keep data completely private
ensure their progress can’t be altered
earn rewards or badges for consistency
build a “growth identity” that evolves over time
🎯 Philosophy

Your growth belongs to you.
Your data stays private.
Your progress is verifiable.

VitraMind is built around 3 pillars:

1. Reflection

Logging moods, habits, and notes helps users understand themselves better.

2. Understanding

AI analyzes patterns and offers actionable insights.

3. Verification

Progress is anchored on-chain as proofs — cryptographically sealed, forever yours.

✨ Features
📝 Daily Logging
Mood tracking (1–5 scale)
Habit tracking (custom habits)
Free-text reflections
Calendar view
Log future/past dates
🤖 AI Insights (Gemini)

Automatically generated after 3+ logs:

📈 1-month behavior predictions
🔄 Habit improvement suggestions
💌 Motivational letters from your future self
🔍 Pattern analysis

All AI results are hashed and anchored on-chain for verifiability.

🔗 Celo On-Chain Anchoring

What goes on-chain:

✔️ Hash of daily log
✔️ Hash of AI insights
✔️ Proof of habit streaks
✔️ Achievement events
✔️ Growth identity NFT (optional)

What does NOT go on-chain:

❌ Raw text
❌ Notes
❌ Mood scores
❌ Sensitive data

🛡️ Privacy by Design
All user data remains off-chain
On-chain entries are only commitments/proofs
Optional encrypted IPFS storage
📊 Dashboard & Analytics
Mood charts
Habit consistency reports
Insight history
Growth progress
🔐 Why Celo?

VitraMind uses Celo because:

✔️ Ultra-low gas fees
✔️ Mobile-first design
✔️ Ideal for Mini Apps
✔️ Stable assets (cUSD)
✔️ User-friendly onboarding

Celo’s ecosystem aligns perfectly with a wellness-focused, mobile-first app.

🏗️ Architecture
Flutter Mini App  
      │
      ▼
Serverpod Backend (Authentication + AI)  
      │
      ▼
Google Gemini (Insight Generation)  
      │
      ▼
Proof Generator (Hashing + Commitments)  
      │
      ▼
Celo Smart Contracts (Anchoring + Growth Identity)

Raw data stays on your phone or encrypted in backend.
Only hashed proofs touch Celo.

🧱 Smart Contract Modules

VitraMind consists of modular Celo contracts:

1. ProfileAnchor.sol

Stores user identity anchor:

mapping(address => bytes32) public profileHash;
2. ProofRegistry.sol

Stores proofs of daily logs, streaks, insights:

function submitProof(bytes32 proof, string memory proofType) external;
3. GrowthNFT.sol (Optional but recommended)

Dynamic NFT that evolves as user grows:

Level up
Visual changes
Milestone badges
4. RewardsEngine.sol (Optional)

Reward streaks or achievements with:

cUSD
points
badges
📱 Mini App Flow
User logs entry →  
Gemini generates insights →  
System hashes everything →  
Celo stores proof →  
NFT evolves (optional) →  
Dashboard updates  

Simple, seamless, mobile-first.

🚀 Roadmap
✅ Phase 1 — MVP
Daily logs
Mood tracking
AI insights
Celo proof registry
🚧 Phase 2 — Full Features
Habit analytics
Insight anchoring
Growth NFT
Streak proofs
🔮 Phase 3 — Advanced
Zero-knowledge proofs
Encrypted IPFS export
Cross-app growth identity
Composable wellness protocols
🛠️ Tech Stack

Frontend: Flutter (Celo Mini App SDK)
Backend: Serverpod
Auth: Email/password → JWT
AI: Google Gemini
Contracts: Solidity v0.8.27
Blockchain: Celo
Storage: Local + optional encrypted IPFS

⚙️ Setup & Installation
1️⃣ Clone the monorepo
git clone https://github.com/your-org/vitramind
cd vitramind
2️⃣ Install Flutter dependencies
flutter pub get
3️⃣ Start Serverpod backend
dart bin/main.dart
4️⃣ Deploy Celo contracts
npx hardhat run scripts/deploy.js --network celo
5️⃣ Configure environment variables
GEMINI_API_KEY=...
CELO_RPC_URL=...
CELO_CONTRACT_ADDRESS=...
SERVERPOD_URL=...
6️⃣ Run the Mini App
flutter run
🧪 Testing
Smart contract tests
npx hardhat test
Flutter widget tests
flutter test
Backend tests
dart test
📄 License

MIT — free to build, remix, innovate.
