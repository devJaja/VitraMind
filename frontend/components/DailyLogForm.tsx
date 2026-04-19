"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { keccak256, encodePacked } from "viem";
import { useMiniPayCUSD } from "@/hooks/useMiniPayCUSD";
import { getLogs, saveLog, createLogEntry, type LogEntry } from "@/lib/logStorage";

const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

const PROOF_REGISTRY_ABI = [{
  name: "submitProof", type: "function",
  inputs: [{ name: "hash", type: "bytes32" }, { name: "proofType", type: "uint8" }],
  outputs: [], stateMutability: "nonpayable",
}] as const;

interface Props {
  proofRegistryAddress?: `0x${string}`;
  onLogSaved?: () => void;
}

type Phase = "idle" | "anchoring_log" | "generating_insight" | "anchoring_insight" | "done" | "error";

const PHASE_LABELS: Record<Phase, string> = {
  idle:               "Submit & Anchor Proof",
  anchoring_log:      "Anchoring log proof…",
  generating_insight: "Generating AI insight…",
  anchoring_insight:  "Anchoring insight proof…",
  done:               "Submit & Anchor Proof",
  error:              "Submit & Anchor Proof",
};

export function DailyLogForm({ proofRegistryAddress, onLogSaved }: Props) {
  const { address, isConnected } = useAccount();
  const { writeContract } = useMiniPayCUSD();

  const [mood, setMood]             = useState(3);
  const [habits, setHabits]         = useState("");
  const [reflection, setReflection] = useState("");
  const [phase, setPhase]           = useState<Phase>("idle");
  const [logTxHash, setLogTxHash]   = useState<string>();
  const [insight, setInsight]       = useState<string>();
  const [errorMsg, setErrorMsg]     = useState<string>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !proofRegistryAddress || !address) return;

    setPhase("anchoring_log");
    setErrorMsg(undefined);
    setInsight(undefined);

    const entry: LogEntry = createLogEntry(mood, habits, reflection);

    try {
      // 1. Hash log locally and anchor LOG proof on-chain
      const logPayload = encodePacked(
        ["address", "uint8", "string", "string", "uint256"],
        [address, mood, habits, reflection, BigInt(Date.now())]
      );
      const logHash = keccak256(logPayload);

      const logTx = await writeContract({
        address: proofRegistryAddress,
        abi: PROOF_REGISTRY_ABI,
        functionName: "submitProof",
        args: [logHash, 0], // ProofType.LOG = 0
      });
      setLogTxHash(logTx);
      entry.logTxHash = logTx;

      // 2. Save log to localStorage
      saveLog(address, entry);

      // 3. Call Gemini — quick_check for first entry, full_insight for multiple
      setPhase("generating_insight");
      const allLogs = getLogs(address);
      const mode = allLogs.length >= 3 ? "full_insight" : "quick_check";
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: allLogs.map(l => ({
            mood: l.mood, habits: l.habits,
            reflection: l.reflection,
            date: new Date(l.date).toLocaleDateString(),
          })),
          mode,
        }),
      });

      const { insight: aiInsight, error: aiError } = await res.json();

      if (aiInsight) {
        setInsight(aiInsight);
        entry.insight = aiInsight;

        // 4. Anchor INSIGHT proof on-chain
        setPhase("anchoring_insight");
        const insightHash = keccak256(encodePacked(["address", "string"], [address, aiInsight]));
        const insightTx = await writeContract({
          address: proofRegistryAddress,
          abi: PROOF_REGISTRY_ABI,
          functionName: "submitProof",
          args: [insightHash, 1], // ProofType.INSIGHT = 1
        });
        entry.insightTxHash = insightTx;
      } else {
        console.warn("Gemini insight skipped:", aiError);
      }

      // 5. Save final entry with insight + tx hashes
      saveLog(address, entry);
      setPhase("done");
      setMood(3); setHabits(""); setReflection("");
      onLogSaved?.();
    } catch (err) {
      console.error("Log submission failed:", err);
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
      // Still save the partial entry
      saveLog(address, entry);
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl mb-2">🔒</p>
        <p className="text-gray-400 text-sm">Connect your wallet to start logging.</p>
      </div>
    );
  }

  const busy = phase === "anchoring_log" || phase === "generating_insight" || phase === "anchoring_insight";

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Mood */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">How are you feeling today?</label>
          <div className="flex gap-3">
            {MOODS.map((emoji, i) => (
              <button key={i} type="button"
                aria-label={`Mood ${i + 1} of 5`}
                aria-pressed={mood === i + 1}
                onClick={() => setMood(i + 1)}
                className={`text-2xl p-2 rounded-xl transition-all ${mood === i + 1 ? "bg-green-500/20 ring-2 ring-green-500 scale-110" : "bg-gray-800 hover:bg-gray-700"}`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Habits */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Habits completed today</label>
          <input type="text" value={habits} onChange={e => setHabits(e.target.value)}
            placeholder="e.g. meditation, exercise, reading"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>

        {/* Reflection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Daily reflection</label>
          <textarea value={reflection} onChange={e => setReflection(e.target.value)}
            placeholder="What did you learn or feel today?" rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>

        {/* Progress steps */}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <span className="animate-spin">⏳</span>
            {PHASE_LABELS[phase]}
          </div>
        )}

        <button type="submit" disabled={busy}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-400 hover:to-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/20">
          {PHASE_LABELS[phase]}
        </button>

        {phase === "done" && logTxHash && (
          <p className="text-green-400 text-sm text-center">
            ✓ Log anchored on Celo{" "}
            <a href={`https://celoscan.io/tx/${logTxHash}`} target="_blank" rel="noopener noreferrer" className="underline">View tx ↗</a>
          </p>
        )}
        {phase === "error" && (
          <p className="text-red-400 text-sm text-center break-words">✗ {errorMsg}</p>
        )}
      </form>

      {/* AI Insight panel */}
      {insight && (
        <div className="bg-gradient-to-br from-purple-950/60 to-gray-900 border border-purple-800/40 rounded-2xl p-5">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">✨ AI Insight</p>
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{insight}</div>
          <p className="text-xs text-purple-500 mt-3">Insight hash anchored on Celo ✓</p>
        </div>
      )}
    </div>
  );
}
