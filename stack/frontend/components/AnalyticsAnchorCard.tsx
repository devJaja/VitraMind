"use client";

import { useState } from "react";
import { openContractCall, bufferCVFromString, uintCV } from "@stacks/connect";
import { useStacksAuth } from "@/lib/stacksAuth";
import { CONTRACTS, NETWORK, explorerTx } from "@/lib/contracts";
import { APP_DETAILS } from "@/lib/stacks";
import { computeWeeklyAnalytics, computeMonthlyAnalytics } from "@/lib/analytics";

type TxStatus = "idle" | "pending" | "done" | "error";

export function AnalyticsAnchorCard() {
  const { stxAddress } = useStacksAuth();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txId, setTxId] = useState<string>();
  const [period, setPeriod] = useState<0 | 1>(0); // 0=weekly 1=monthly

  function anchor() {
    if (!stxAddress) return;
    const digest = period === 0
      ? computeWeeklyAnalytics(stxAddress, 1)[0]?.digestHash
      : computeMonthlyAnalytics(stxAddress).digestHash;

    if (!digest) return;

    const [contractAddress, contractName] = CONTRACTS.analyticsRegistry.split(".");
    setStatus("pending");
    openContractCall({
      contractAddress, contractName,
      functionName: "anchor-snapshot",
      functionArgs: [
        { type: "principal", value: stxAddress } as unknown as import("@stacks/transactions").ClarityValue,
        bufferCVFromString(digest),
        uintCV(period),
      ],
      network: NETWORK,
      appDetails: APP_DETAILS,
      onFinish: ({ txId: id }) => { setTxId(id); setStatus("done"); },
      onCancel: () => setStatus("idle"),
    });
  }

  if (!stxAddress) return null;

  const weekly  = computeWeeklyAnalytics(stxAddress, 1)[0];
  const monthly = computeMonthlyAnalytics(stxAddress);

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white mb-1">📊 Analytics Anchor</p>
        <p className="text-xs text-gray-500">Anchor a privacy-preserving digest of your analytics on-chain.</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {([0, 1] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 text-xs py-2 rounded-xl font-medium transition-all ${period === p ? "bg-orange-500 text-black" : "bg-gray-800 text-gray-400"}`}>
            {p === 0 ? "Weekly" : "Monthly"}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="bg-gray-800/60 rounded-xl p-3 space-y-1">
        {period === 0 && weekly && (
          <>
            <p className="text-xs text-gray-400">Week of {weekly.weekStart}</p>
            <p className="text-xs text-gray-300">{weekly.logCount} logs · avg mood {weekly.avgMood || "—"}</p>
            <p className="text-xs font-mono text-gray-600 truncate">digest: {weekly.digestHash.slice(0, 20)}…</p>
          </>
        )}
        {period === 1 && (
          <>
            <p className="text-xs text-gray-400">{monthly.month}</p>
            <p className="text-xs text-gray-300">{monthly.logCount} logs · {monthly.streak}d streak</p>
            <p className="text-xs font-mono text-gray-600 truncate">digest: {monthly.digestHash.slice(0, 20)}…</p>
          </>
        )}
      </div>

      <button onClick={anchor} disabled={status === "pending"}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl text-sm transition-all">
        {status === "pending" ? "⏳ Awaiting wallet…" : "Anchor Digest"}
      </button>

      {status === "done" && txId && (
        <p className="text-xs text-green-400">
          ✓ Anchored{" "}
          <a href={explorerTx(txId)} target="_blank" rel="noopener noreferrer" className="underline">View ↗</a>
        </p>
      )}
    </div>
  );
}
