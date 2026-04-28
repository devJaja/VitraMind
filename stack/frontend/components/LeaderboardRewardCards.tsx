"use client";

import { useState } from "react";
import { openContractCall, stringAsciiCV, uintCV } from "@stacks/connect";
import { CONTRACTS, NETWORK, explorerTx } from "@/lib/contracts";
import { APP_DETAILS } from "@/lib/stacks";
import { useStacksAuth } from "@/lib/stacksAuth";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useRewardVault } from "@/hooks/useRewardVault";

type TxStatus = "idle" | "pending" | "done" | "error";

function microStxToStx(micro: number) {
  return (micro / 1_000_000).toFixed(2);
}

export function LeaderboardCard() {
  const { stxAddress } = useStacksAuth();
  const { myEntry } = useLeaderboard();
  const [alias, setAlias] = useState(myEntry?.alias ?? "");
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txId, setTxId] = useState<string>();

  function publish() {
    if (!stxAddress || !alias.trim()) return;
    const [contractAddress, contractName] = CONTRACTS.leaderboard.split(".");
    setStatus("pending");
    openContractCall({
      contractAddress, contractName,
      functionName: "publish-score",
      functionArgs: [
        stringAsciiCV(alias.slice(0, 24)),
        uintCV(0), // streak — oracle will update; user publishes alias
        uintCV(0),
      ],
      network: NETWORK,
      appDetails: APP_DETAILS,
      onFinish: ({ txId: id }) => { setTxId(id); setStatus("done"); },
      onCancel: () => setStatus("idle"),
    });
  }

  function remove() {
    if (!stxAddress) return;
    const [contractAddress, contractName] = CONTRACTS.leaderboard.split(".");
    setStatus("pending");
    openContractCall({
      contractAddress, contractName,
      functionName: "remove-entry",
      functionArgs: [],
      network: NETWORK,
      appDetails: APP_DETAILS,
      onFinish: ({ txId: id }) => { setTxId(id); setStatus("done"); },
      onCancel: () => setStatus("idle"),
    });
  }

  if (!stxAddress) return null;

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white mb-1">🏆 Leaderboard</p>
        <p className="text-xs text-gray-500">Opt in with an alias. Only your alias and streak are public — no wallet address shown.</p>
      </div>

      {myEntry && (
        <div className="bg-orange-950/40 border border-orange-800/30 rounded-xl p-3">
          <p className="text-xs text-orange-400 font-semibold">{myEntry.alias}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            🔥 {myEntry.streak} day streak · {myEntry.points} pts
          </p>
        </div>
      )}

      <input
        value={alias}
        onChange={e => setAlias(e.target.value)}
        placeholder="Choose a display alias (max 24 chars)"
        maxLength={24}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />

      <div className="flex gap-2">
        <button
          onClick={publish}
          disabled={status === "pending" || !alias.trim()}
          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 disabled:opacity-50 text-black font-bold py-2 rounded-xl text-sm transition-all"
        >
          {myEntry ? "Update" : "Join Leaderboard"}
        </button>
        {myEntry && (
          <button
            onClick={remove}
            disabled={status === "pending"}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 font-bold px-4 py-2 rounded-xl text-sm transition-all"
          >
            Leave
          </button>
        )}
      </div>

      {status === "pending" && <p className="text-xs text-yellow-400">⏳ Awaiting wallet…</p>}
      {status === "done" && txId && (
        <p className="text-xs text-green-400">
          ✓ Updated{" "}
          <a href={explorerTx(txId)} target="_blank" rel="noopener noreferrer" className="underline">View ↗</a>
        </p>
      )}
    </div>
  );
}

export function RewardVaultCard() {
  const { stxAddress } = useStacksAuth();
  const { rewards } = useRewardVault();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txId, setTxId] = useState<string>();

  function claim() {
    if (!stxAddress) return;
    const [contractAddress, contractName] = CONTRACTS.rewardVault.split(".");
    setStatus("pending");
    openContractCall({
      contractAddress, contractName,
      functionName: "claim-rewards",
      functionArgs: [],
      network: NETWORK,
      appDetails: APP_DETAILS,
      onFinish: ({ txId: id }) => { setTxId(id); setStatus("done"); },
      onCancel: () => setStatus("idle"),
    });
  }

  if (!stxAddress) return null;

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white mb-1">💎 Reward Vault</p>
        <p className="text-xs text-gray-500">Streak milestones (7 / 30 / 100 days) unlock STX rewards.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-xs text-gray-400">Pending</p>
          <p className="text-lg font-bold text-orange-400">{microStxToStx(rewards.pending)} STX</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-xs text-gray-400">Claimed</p>
          <p className="text-lg font-bold text-green-400">{microStxToStx(rewards.claimed)} STX</p>
        </div>
      </div>

      <div className="flex gap-2 text-xs text-gray-600">
        <span>7d → 0.5 STX</span>
        <span>·</span>
        <span>30d → 2 STX</span>
        <span>·</span>
        <span>100d → 10 STX</span>
      </div>

      <button
        onClick={claim}
        disabled={status === "pending" || rewards.pending === 0}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl text-sm transition-all"
      >
        {status === "pending" ? "⏳ Awaiting wallet…" : rewards.pending > 0 ? `Claim ${microStxToStx(rewards.pending)} STX` : "No rewards pending"}
      </button>

      {status === "done" && txId && (
        <p className="text-xs text-green-400">
          ✓ Claimed{" "}
          <a href={explorerTx(txId)} target="_blank" rel="noopener noreferrer" className="underline">View ↗</a>
        </p>
      )}
    </div>
  );
}
