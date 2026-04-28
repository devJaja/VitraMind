"use client";

import { useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";
import { getLogs, getLogStreak, getMoodAverage } from "@/lib/logStorage";
import { useProofRegistry } from "@/hooks/useProofRegistry";
import { growthTierLabel } from "@/lib/format";

export function ShareCard() {
  const { stxAddress } = useStacksAuth();
  const { proofCount } = useProofRegistry();
  const [copied, setCopied] = useState(false);

  if (!stxAddress) return null;

  const streak = getLogStreak(stxAddress);
  const moodAvg = getMoodAverage(stxAddress, 7);
  const logCount = getLogs(stxAddress).length;
  const tier = growthTierLabel(Math.min(streak, 100));

  const text = `🌱 My VitraMind Growth Stats\n\n🔥 ${streak}-day streak\n📊 ${logCount} journal entries\n⛓️ ${proofCount} on-chain proofs\n😊 ${moodAvg ? `${moodAvg}/5` : "—"} mood avg\n${tier}\n\nPrivacy-first growth on Bitcoin via Stacks.\nhttps://vitramind.app`;

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-gradient-to-br from-orange-950/60 via-gray-900 to-black border border-orange-900/40 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-semibold text-white">📤 Share Your Progress</p>

      {/* Card preview */}
      <div className="bg-black/60 border border-orange-900/30 rounded-xl p-4 space-y-2">
        <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider">VitraMind Growth</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Streak", value: `${streak}d 🔥` },
            { label: "Logs", value: `${logCount} 📔` },
            { label: "Proofs", value: `${proofCount} ⛓️` },
            { label: "Mood Avg", value: moodAvg ? `${moodAvg}/5 😊` : "— 😊" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-800/60 rounded-lg p-2">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-orange-400">{tier}</p>
        <p className="text-xs text-gray-600">Secured by Bitcoin via Stacks</p>
      </div>

      <button onClick={copy}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-black font-bold py-2.5 rounded-xl text-sm transition-all">
        {copied ? "✓ Copied!" : "Copy to Clipboard"}
      </button>
    </div>
  );
}
