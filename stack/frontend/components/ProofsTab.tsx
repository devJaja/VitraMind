"use client";

import { useProofRegistry } from "@/hooks/useProofRegistry";
import { CONTRACTS, explorerTx } from "@/lib/contracts";

const TYPE_COLORS: Record<string, string> = {
  LOG:         "bg-blue-500/20 text-blue-400",
  INSIGHT:     "bg-purple-500/20 text-purple-400",
  STREAK:      "bg-orange-500/20 text-orange-400",
  ACHIEVEMENT: "bg-yellow-500/20 text-yellow-400",
};

export function ProofsTab() {
  const { proofCount } = useProofRegistry();

  if (proofCount === 0) return (
    <div className="text-center py-10">
      <p className="text-3xl mb-2">📭</p>
      <p className="text-gray-500 text-sm">No proofs anchored yet. Submit your first log!</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">{proofCount} proof{proofCount !== 1 ? "s" : ""} anchored on Stacks</p>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs text-gray-400">
          View your proofs on the{" "}
          <a
            href={`https://explorer.hiro.so/txid/${CONTRACTS.proofRegistry}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 underline"
          >
            Stacks Explorer ↗
          </a>
        </p>
      </div>
    </div>
  );
}
