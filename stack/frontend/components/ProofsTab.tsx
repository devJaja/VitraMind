"use client";

import { useEffect, useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";
import { useProofRegistry } from "@/hooks/useProofRegistry";
import { getLogs, type LogEntry } from "@/lib/logStorage";
import { CONTRACTS, explorerTx } from "@/lib/contracts";

const TYPE_COLORS: Record<string, string> = {
  LOG:         "bg-blue-500/20 text-blue-400",
  INSIGHT:     "bg-purple-500/20 text-purple-400",
  STREAK:      "bg-orange-500/20 text-orange-400",
  ACHIEVEMENT: "bg-yellow-500/20 text-yellow-400",
};

interface LocalProof {
  type: "LOG" | "INSIGHT";
  date: string;
  txHash: string;
}

export function ProofsTab() {
  const { stxAddress } = useStacksAuth();
  const { proofCount } = useProofRegistry();
  const [localProofs, setLocalProofs] = useState<LocalProof[]>([]);

  useEffect(() => {
    if (!stxAddress) return;
    const logs = getLogs(stxAddress);
    const proofs: LocalProof[] = [];
    logs.forEach(l => {
      if (l.logTxHash) proofs.push({ type: "LOG", date: l.date, txHash: l.logTxHash });
      if (l.insightTxHash) proofs.push({ type: "INSIGHT", date: l.date, txHash: l.insightTxHash });
    });
    setLocalProofs(proofs.reverse());
  }, [stxAddress]);

  if (!stxAddress) return null;

  if (proofCount === 0 && localProofs.length === 0) return (
    <div className="text-center py-10">
      <p className="text-3xl mb-2">📭</p>
      <p className="text-gray-500 text-sm">No proofs anchored yet. Submit your first log!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{proofCount} proof{proofCount !== 1 ? "s" : ""} anchored on Stacks</p>
        <a href={`https://explorer.hiro.so/address/${CONTRACTS.proofRegistry}?chain=mainnet`}
          target="_blank" rel="noopener noreferrer"
          className="text-xs text-orange-400 hover:text-orange-300 underline">
          View contract ↗
        </a>
      </div>

      {localProofs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Proof History</p>
          {localProofs.map((p, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[p.type]}`}>
                  {p.type}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <a href={explorerTx(p.txHash)} target="_blank" rel="noopener noreferrer"
                className="text-xs text-orange-400 hover:text-orange-300 underline font-mono">
                {p.txHash.slice(0, 8)}… ↗
              </a>
            </div>
          ))}
        </div>
      )}

      {localProofs.length === 0 && proofCount > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400">
            {proofCount} proofs found on-chain. View them on the{" "}
            <a href={`https://explorer.hiro.so/address/${CONTRACTS.proofRegistry}?chain=mainnet`}
              target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">
              Stacks Explorer ↗
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
