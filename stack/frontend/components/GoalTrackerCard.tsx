"use client";

import { useState } from "react";
import { openContractCall, bufferCVFromString, uintCV } from "@stacks/connect";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { CONTRACTS, NETWORK, explorerTx } from "@/lib/contracts";
import { APP_DETAILS } from "@/lib/stacks";
import { useStacksAuth } from "@/lib/stacksAuth";
import { useGoalTracker } from "@/hooks/useGoalTracker";

const STATUS_LABELS = ["🎯 Active", "✅ Completed", "🚫 Abandoned"];
const STATUS_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-green-500/20 text-green-400",
  "bg-gray-500/20 text-gray-500",
];

type TxStatus = "idle" | "pending" | "done" | "error";

export function GoalTrackerCard() {
  const { stxAddress } = useStacksAuth();
  const { goalCount, goals } = useGoalTracker();
  const [goalText, setGoalText] = useState("");
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txId, setTxId] = useState<string>();
  const [err, setErr] = useState<string>();

  function commitGoal() {
    if (!stxAddress || !goalText.trim()) return;
    const commitment = sha256(new TextEncoder().encode(`${stxAddress}:${goalText}:${Date.now()}`));
    const [contractAddress, contractName] = CONTRACTS.goalTracker.split(".");
    setStatus("pending"); setErr(undefined);
    openContractCall({
      contractAddress, contractName,
      functionName: "commit-goal",
      functionArgs: [bufferCVFromString(bytesToHex(commitment))],
      network: NETWORK,
      appDetails: APP_DETAILS,
      onFinish: ({ txId: id }) => { setTxId(id); setStatus("done"); setGoalText(""); },
      onCancel: () => setStatus("idle"),
    });
  }

  function updateStatus(goalId: number, newStatus: number) {
    if (!stxAddress) return;
    const [contractAddress, contractName] = CONTRACTS.goalTracker.split(".");
    setStatus("pending"); setErr(undefined);
    openContractCall({
      contractAddress, contractName,
      functionName: "update-goal-status",
      functionArgs: [uintCV(goalId), uintCV(newStatus)],
      network: NETWORK,
      appDetails: APP_DETAILS,
      onFinish: ({ txId: id }) => { setTxId(id); setStatus("done"); },
      onCancel: () => setStatus("idle"),
    });
  }

  if (!stxAddress) return null;

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-4">
      <div>
        <p className="text-sm font-semibold text-white mb-1">🎯 Goal Tracker</p>
        <p className="text-xs text-gray-500">Commit goal hashes on-chain. Your goal text stays private.</p>
      </div>

      {/* Existing goals */}
      {goals.length > 0 && (
        <div className="space-y-2">
          {goals.map((g, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-3 flex items-center justify-between gap-2">
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[g.status]}`}>
                  {STATUS_LABELS[g.status]}
                </span>
                <p className="text-xs text-gray-600 mt-1 font-mono truncate max-w-[160px]">
                  {g.commitment.slice(0, 18)}…
                </p>
              </div>
              {g.status === 0 && (
                <div className="flex gap-1">
                  <button onClick={() => updateStatus(i, 1)}
                    className="text-xs bg-green-900/40 hover:bg-green-800/60 text-green-400 px-2 py-1 rounded-lg transition-colors">
                    Done
                  </button>
                  <button onClick={() => updateStatus(i, 2)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-400 px-2 py-1 rounded-lg transition-colors">
                    Drop
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New goal */}
      <div className="space-y-2">
        <input
          value={goalText}
          onChange={e => setGoalText(e.target.value)}
          placeholder="Describe your goal (hashed locally, never sent on-chain)"
          maxLength={500}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={commitGoal}
          disabled={status === "pending" || !goalText.trim()}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl text-sm transition-all"
        >
          {status === "pending" ? "⏳ Awaiting wallet…" : `Commit Goal (${goalCount} on-chain)`}
        </button>
      </div>

      {status === "done" && txId && (
        <p className="text-xs text-green-400">
          ✓ Committed{" "}
          <a href={explorerTx(txId)} target="_blank" rel="noopener noreferrer" className="underline">View ↗</a>
        </p>
      )}
      {status === "error" && <p className="text-xs text-red-400 break-words">✗ {err}</p>}
    </div>
  );
}
