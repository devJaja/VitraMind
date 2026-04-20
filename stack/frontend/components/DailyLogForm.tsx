"use client";

import { useState } from "react";
import { openContractCall, bufferCVFromString, uintCV } from "@stacks/connect";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { useStacksAuth } from "@/lib/stacksAuth";
import { APP_DETAILS, NETWORK } from "@/lib/stacks";
import { getLogs, saveLog, createLogEntry, type LogEntry } from "@/lib/logStorage";

const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

interface Props {
  proofRegistryAddress?: string; // "deployer.proof-registry"
  onLogSaved?: () => void;
}

type Phase = "idle" | "anchoring_log" | "generating_insight" | "anchoring_insight" | "done" | "error";

const PHASE_LABELS: Record<Phase, string> = {
  idle:               "Submit & Anchor Proof",
  anchoring_log:      "Awaiting wallet…",
  generating_insight: "Generating AI insight…",
  anchoring_insight:  "Awaiting wallet…",
  done:               "Submit & Anchor Proof",
  error:              "Submit & Anchor Proof",
};

function hashStr(input: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(input)));
}

function contractCall(contractId: string, functionName: string, functionArgs: unknown[]): Promise<string> {
  const [contractAddress, contractName] = contractId.split(".");
  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress,
      contractName,
      functionName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      functionArgs: functionArgs as any[],
      network: NETWORK,
      appDetails: APP_DETAILS,
      onFinish: ({ txId }) => resolve(txId),
      onCancel: () => reject(new Error("Cancelled")),
    });
  });
}

export function DailyLogForm({ proofRegistryAddress, onLogSaved }: Props) {
  const { stxAddress, isConnected } = useStacksAuth();

  const [mood, setMood]             = useState(3);
  const [habits, setHabits]         = useState("");
  const [reflection, setReflection] = useState("");
  const [phase, setPhase]           = useState<Phase>("idle");
  const [logTxId, setLogTxId]       = useState<string>();
  const [insight, setInsight]       = useState<string>();
  const [errorMsg, setErrorMsg]     = useState<string>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !proofRegistryAddress || !stxAddress) return;

    setPhase("anchoring_log");
    setErrorMsg(undefined);
    setInsight(undefined);

    const entry: LogEntry = createLogEntry(mood, habits, reflection);

    try {
      // 1. Hash log locally and anchor LOG proof on-chain
      const logHash = hashStr(`${stxAddress}:${mood}:${habits}:${reflection}:${Date.now()}`);
      const txId = await contractCall(proofRegistryAddress, "submit-proof", [
        bufferCVFromString(logHash),
        uintCV(0), // ProofType.LOG = 0
      ]);
      setLogTxId(txId);
      entry.logTxHash = txId;

      // 2. Save log to localStorage
      saveLog(stxAddress, entry);

      // 3. Call Gemini
      setPhase("generating_insight");
      const allLogs = getLogs(stxAddress);
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
        const insightHash = hashStr(`${stxAddress}:${aiInsight}`);
        const insightTxId = await contractCall(proofRegistryAddress, "submit-proof", [
          bufferCVFromString(insightHash),
          uintCV(1), // ProofType.INSIGHT = 1
        ]);
        entry.insightTxHash = insightTxId;
      } else {
        console.warn("Gemini insight skipped:", aiError);
      }

      saveLog(stxAddress, entry);
      setPhase("done");
      setMood(3); setHabits(""); setReflection("");
      onLogSaved?.();
    } catch (err) {
      console.error("Log submission failed:", err);
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
      saveLog(stxAddress, entry);
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl mb-2">🔒</p>
        <p className="text-gray-400 text-sm">Connect your Stacks wallet to start logging.</p>
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
                className={`text-2xl p-2 rounded-xl transition-all ${mood === i + 1 ? "bg-orange-500/20 ring-2 ring-orange-500 scale-110" : "bg-gray-800 hover:bg-gray-700"}`}>
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
            maxLength={200}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>

        {/* Reflection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Daily reflection</label>
          <textarea value={reflection} onChange={e => setReflection(e.target.value)}
            placeholder="What did you learn or feel today?" rows={3}
            maxLength={1000}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
        </div>

        {busy && (
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <span className="animate-spin">⏳</span>
            {PHASE_LABELS[phase]}
          </div>
        )}

        <button type="submit" disabled={busy}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20">
          {PHASE_LABELS[phase]}
        </button>

        {phase === "done" && logTxId && (
          <p className="text-orange-400 text-sm text-center">
            ✓ Log anchored on Stacks{" "}
            <a href={`https://explorer.hiro.so/txid/${logTxId}`} target="_blank" rel="noopener noreferrer" className="underline">View tx ↗</a>
          </p>
        )}
        {phase === "error" && (
          <p className="text-red-400 text-sm text-center break-words">✗ {errorMsg}</p>
        )}
      </form>

      {insight && (
        <div className="bg-gradient-to-br from-purple-950/60 to-gray-900 border border-purple-800/40 rounded-2xl p-5">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">✨ AI Insight</p>
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{insight}</div>
          <p className="text-xs text-purple-500 mt-3">Insight hash anchored on Stacks ✓</p>
        </div>
      )}
    </div>
  );
}
