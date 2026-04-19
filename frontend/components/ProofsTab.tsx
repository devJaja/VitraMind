"use client";

import { useProofList } from "@/hooks/useProofList";
import { CONTRACTS, celoscanTx, celoscanAddr } from "@/lib/contracts";

const TYPE_COLORS: Record<string, string> = {
  LOG:         "bg-blue-500/20 text-blue-400",
  INSIGHT:     "bg-purple-500/20 text-purple-400",
  STREAK:      "bg-orange-500/20 text-orange-400",
  ACHIEVEMENT: "bg-yellow-500/20 text-yellow-400",
};

export function ProofsTab() {
  const { proofs, isLoading, count } = useProofList();

  if (isLoading) return <p className="text-gray-500 text-sm text-center py-8">Loading proofs…</p>;
  if (count === 0) return (
    <div className="text-center py-10">
      <p className="text-3xl mb-2">📭</p>
      <p className="text-gray-500 text-sm">No proofs anchored yet. Submit your first log!</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">{count} proof{count !== 1 ? "s" : ""} anchored on Celo</p>
      {[...proofs].reverse().map((p) => (
        <div key={p.index} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[p.proofType]}`}>
              {p.proofType}
            </span>
            <span className="text-xs text-gray-500">{p.timestamp}</span>
          </div>
          <p className="text-xs font-mono text-gray-400 break-all">{p.hash}</p>
          <a
            href={celoscanAddr(CONTRACTS.celo.ProofRegistry!)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-500 hover:text-green-400 transition-colors"
          >
            Verify on Celoscan ↗
          </a>
        </div>
      ))}
    </div>
  );
}
