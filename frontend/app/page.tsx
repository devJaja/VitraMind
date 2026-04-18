"use client";

import { Dashboard } from "@/components/Dashboard";
import { DailyLogForm } from "@/components/DailyLogForm";
import { CONTRACTS } from "@/lib/contracts";
import { useChainId } from "wagmi";

export default function Home() {
  const chainId = useChainId();
  const contracts = chainId === 42220 ? CONTRACTS.celo : CONTRACTS.alfajores;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Your Growth
        </h2>
        <Dashboard />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Today&apos;s Log
        </h2>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <DailyLogForm proofRegistryAddress={contracts.ProofRegistry} />
        </div>
      </section>

      <p className="text-xs text-gray-600 text-center">
        Your raw data never leaves your device. Only cryptographic proofs are anchored on Celo.{" "}
        <a
          href={`https://celoscan.io/address/${contracts.ProofRegistry}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-400 transition-colors"
        >
          View registry ↗
        </a>
      </p>
    </div>
  );
}
