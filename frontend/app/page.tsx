"use client";

import { Dashboard } from "@/components/Dashboard";
import { DailyLogForm } from "@/components/DailyLogForm";
import { CONTRACTS } from "@/lib/contracts";
import { useAccount } from "wagmi";

export default function Home() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  // Always use Celo mainnet contracts regardless of wallet's current chain.
  // Chain switching happens inside useMiniPayCUSD before the tx is sent.
  const contracts = CONTRACTS.celo;

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-green-950 via-gray-900 to-black border border-green-900/40 p-6 pt-8">
        {/* Glow orb */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">
          Privacy-first · On-chain proofs
        </p>
        <h1 className="text-3xl font-extrabold text-white leading-tight mb-2">
          Grow every day.<br />
          <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            Prove it on Celo.
          </span>
        </h1>
        <p className="text-sm text-gray-400 max-w-xs">
          Track habits, moods & reflections. Your data stays private — only cryptographic proofs touch the blockchain.
        </p>

        {/* Chain pill */}
        <div className="mt-4 inline-flex items-center gap-1.5 bg-black/40 border border-green-900/50 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">
            {chainId === 42220 ? "Celo Mainnet" : "Alfajores Testnet"}
          </span>
        </div>
      </div>

      {/* Dashboard — only when connected */}
      {isConnected && (
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Your Growth
          </p>
          <Dashboard />
        </section>
      )}

      {/* Daily log */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Today&apos;s Log
        </p>
        <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gradient-to-b from-gray-900 to-black p-5">
          <DailyLogForm proofRegistryAddress={contracts.ProofRegistry} />
        </div>
      </section>

      {/* Footer */}
      <p className="text-xs text-gray-700 text-center pb-4">
        Raw data never leaves your device ·{" "}
        <a
          href={`https://celoscan.io/address/${contracts.ProofRegistry}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-green-400 transition-colors underline underline-offset-2"
        >
          View ProofRegistry ↗
        </a>
      </p>
    </div>
  );
}
