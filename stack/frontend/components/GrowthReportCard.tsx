"use client";

import { useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";
import { getLogs } from "@/lib/logStorage";
import { useProofRegistry } from "@/hooks/useProofRegistry";
import { useStreakVerifier } from "@/hooks/useStreakVerifier";

function InsightBlock({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className="text-white font-semibold">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </div>
  );
}

export function GrowthReportCard() {
  const { stxAddress } = useStacksAuth();
  const { proofCount } = useProofRegistry();
  const { currentStreak } = useStreakVerifier();
  const [report, setReport] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function generate() {
    if (!stxAddress) return;
    const logs = getLogs(stxAddress).map(l => ({
      mood: l.mood, habits: l.habits,
      reflection: l.reflection,
      date: new Date(l.date).toLocaleDateString(),
    }));
    if (!logs.length) return;

    setLoading(true); setError(undefined);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs, streak: currentStreak, proofCount }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!stxAddress) return null;

  const logCount = getLogs(stxAddress).length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">📈 Growth Report</p>
          <p className="text-xs text-gray-500">AI-powered analysis of your full journey</p>
        </div>
        <button onClick={generate} disabled={loading || logCount === 0}
          className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-full transition-colors">
          {loading ? "Analyzing…" : "Generate"}
        </button>
      </div>

      {logCount === 0 && (
        <p className="text-xs text-gray-600">Submit at least one log to generate a report.</p>
      )}

      {report && (
        <div className="bg-green-950/30 border border-green-800/30 rounded-xl p-4">
          <InsightBlock text={report} />
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
