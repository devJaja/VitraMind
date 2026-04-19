"use client";

import { useAccount, useChainId } from "wagmi";
import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { DailyLogForm } from "@/components/DailyLogForm";
import { ProfileAnchorCard, StreakAnchorCard, IPFSExportCard, GrowthIdentityCard, WellnessProtocolCard } from "@/components/ContractActions";
import { ProofsTab } from "@/components/ProofsTab";
import { useRewards } from "@/hooks/useRewards";
import { CONTRACTS } from "@/lib/contracts";

const contracts = CONTRACTS.celo;

const TABS = ["Log", "Proofs", "Profile", "Streak", "Identity", "Wellness", "Export"] as const;
type Tab = typeof TABS[number];

function RewardsBar() {
  const { points, claimedCUSD, highestStreakRewarded } = useRewards();
  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Points", value: points.toString() },
        { label: "cUSD Earned", value: `${(Number(claimedCUSD) / 1e18).toFixed(2)}` },
        { label: "Best Streak", value: `${highestStreakRewarded}d` },
      ].map(({ label, value }) => (
        <div key={label} className="bg-gray-800/60 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          <p className="text-sm font-bold text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [tab, setTab] = useState<Tab>("Log");

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-green-950 via-gray-900 to-black border border-green-900/40 p-6 pt-8">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">Privacy-first · On-chain proofs</p>
        <h1 className="text-3xl font-extrabold text-white leading-tight mb-2">
          Grow every day.<br />
          <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">Prove it on Celo.</span>
        </h1>
        <p className="text-sm text-gray-400 max-w-xs">Track habits, moods & reflections. Only cryptographic proofs touch the blockchain.</p>
        <div className="mt-4 inline-flex items-center gap-1.5 bg-black/40 border border-green-900/50 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">{chainId === 42220 ? "Celo Mainnet" : "Celo (switching…)"}</span>
        </div>
      </div>

      {/* Dashboard + Rewards — only when connected */}
      {isConnected && (
        <section className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Growth</p>
          <Dashboard onViewProofs={() => setTab("Proofs")} />
          <RewardsBar />
        </section>
      )}

      {/* Tab nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
              tab === t ? "bg-green-500 text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "Log" && (
          <div className="rounded-2xl overflow-hidden border border-gray-800 bg-gradient-to-b from-gray-900 to-black p-5">
            <DailyLogForm proofRegistryAddress={contracts.ProofRegistry} />
          </div>
        )}
        {tab === "Proofs"    && <ProofsTab />}
        {tab === "Profile"  && <ProfileAnchorCard />}
        {tab === "Streak"   && <StreakAnchorCard />}
        {tab === "Identity" && <GrowthIdentityCard />}
        {tab === "Wellness" && <WellnessProtocolCard />}
        {tab === "Export"   && <IPFSExportCard />}
      </div>

      <p className="text-xs text-gray-700 text-center pb-4">
        Raw data never leaves your device ·{" "}
        <a href={`https://celoscan.io/address/${contracts.ProofRegistry}`} target="_blank" rel="noopener noreferrer"
          className="text-gray-500 hover:text-green-400 transition-colors underline underline-offset-2">
          View ProofRegistry ↗
        </a>
      </p>
    </div>
  );
}
