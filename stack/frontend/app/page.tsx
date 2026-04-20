"use client";

import { useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";
import { Dashboard } from "@/components/Dashboard";
import { MoodChart } from "@/components/MoodChart";
import { HabitHeatmap } from "@/components/HabitHeatmap";
import { DailyLogForm } from "@/components/DailyLogForm";
import { HistoryTab } from "@/components/HistoryTab";
import { AITab } from "@/components/AITab";
import { ProofsTab } from "@/components/ProofsTab";
import { ProfileAnchorCard, StreakAnchorCard, IPFSExportCard, GrowthIdentityCard, WellnessProtocolCard } from "@/components/ContractActions";
import { useToast } from "@/components/Toast";
import { CONTRACTS, NETWORK, explorerTx } from "@/lib/contracts";

const TABS = ["Log", "AI", "History", "Proofs", "Profile", "Streak", "Identity", "Wellness", "Export"] as const;
type Tab = typeof TABS[number];

export default function Home() {
  const { isConnected } = useStacksAuth();
  const [tab, setTab] = useState<Tab>("Log");
  const [historyKey, setHistoryKey] = useState(0);
  const { show: showToast, node: toastNode } = useToast();

  function handleLogSaved() {
    setHistoryKey(k => k + 1);
    showToast("✓ Log anchored on Stacks!", "success");
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-950 via-gray-900 to-black border border-orange-900/40 p-6 pt-8">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Privacy-first · Bitcoin-secured</p>
        <h1 className="text-3xl font-extrabold text-white leading-tight mb-2">
          Grow every day.<br />
          <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">Prove it on Bitcoin.</span>
        </h1>
        <p className="text-sm text-gray-400 max-w-xs">Track habits, moods & reflections. AI insights powered by Gemini. Only cryptographic proofs touch the blockchain.</p>
        <div className="mt-4 inline-flex items-center gap-1.5 bg-black/40 border border-orange-900/50 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-xs text-orange-400 font-medium">Stacks {NETWORK === "mainnet" ? "Mainnet" : "Testnet"}</span>
        </div>
      </div>

      {/* Dashboard */}
      {isConnected && (
        <section className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Growth</p>
          <Dashboard onViewProofs={() => setTab("Proofs")} />
          <MoodChart />
          <HabitHeatmap />
        </section>
      )}

      {/* Tab nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
              tab === t ? "bg-orange-500 text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "Log" && (
          <div className="rounded-2xl overflow-hidden border border-gray-800 bg-gradient-to-b from-gray-900 to-black p-5">
            <DailyLogForm proofRegistryAddress={CONTRACTS.proofRegistry} onLogSaved={handleLogSaved} />
          </div>
        )}
        {tab === "History"  && <HistoryTab refreshKey={historyKey} />}
        {tab === "AI"       && <AITab refreshKey={historyKey} />}
        {tab === "Proofs"   && <ProofsTab />}
        {tab === "Profile"  && <ProfileAnchorCard />}
        {tab === "Streak"   && <StreakAnchorCard />}
        {tab === "Identity" && <GrowthIdentityCard />}
        {tab === "Wellness" && <WellnessProtocolCard />}
        {tab === "Export"   && <IPFSExportCard />}
      </div>

      <p className="text-xs text-gray-700 text-center pb-4">
        Raw data never leaves your device · Secured by Bitcoin via Stacks
      </p>
      {toastNode}
    </div>
  );
}
