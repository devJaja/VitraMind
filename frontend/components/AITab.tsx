"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getLogs } from "@/lib/logStorage";

const QUICK_QUESTIONS = [
  "What habit should I focus on most?",
  "How has my mood been trending?",
  "What's my biggest growth area?",
  "Am I being consistent?",
  "What should I do differently next week?",
];

function InsightBlock({ text }: { text: string }) {
  // Render **bold** markdown
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

export function AITab({ refreshKey }: { refreshKey?: number }) {
  const { address } = useAccount();
  const [logCount, setLogCount] = useState(0);
  const [weekly, setWeekly]     = useState<string>();
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer]     = useState<string>();
  const [askLoading, setAskLoading] = useState(false);
  const [error, setError]       = useState<string>();

  useEffect(() => {
    if (address) setLogCount(getLogs(address).length);
  }, [address, refreshKey]);

  async function callAI(mode: string, q?: string) {
    if (!address) return null;
    const logs = getLogs(address).map(l => ({
      mood: l.mood, habits: l.habits,
      reflection: l.reflection,
      date: new Date(l.date).toLocaleDateString(),
    }));
    if (!logs.length) return null;

    const res = await fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs, mode, question: q }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.insight as string;
  }

  async function handleWeeklySummary() {
    setWeeklyLoading(true); setError(undefined);
    try { setWeekly(await callAI("weekly_summary") ?? undefined); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setWeeklyLoading(false); }
  }

  async function handleAsk(q: string) {
    if (!q.trim()) return;
    setAskLoading(true); setError(undefined); setAnswer(undefined);
    try { setAnswer(await callAI("ask", q) ?? undefined); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setAskLoading(false); }
  }

  if (!address) return null;

  if (logCount === 0) return (
    <div className="text-center py-10">
      <p className="text-3xl mb-2">🤖</p>
      <p className="text-gray-500 text-sm">Submit your first log to unlock AI insights.</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Weekly Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-white">📊 Weekly Summary</p>
            <p className="text-xs text-gray-500">AI analysis of your recent {logCount} entr{logCount === 1 ? "y" : "ies"}</p>
          </div>
          <button onClick={handleWeeklySummary} disabled={weeklyLoading}
            className="text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-full transition-colors">
            {weeklyLoading ? "Analyzing…" : "Generate"}
          </button>
        </div>
        {weekly && (
          <div className="bg-purple-950/40 border border-purple-800/30 rounded-xl p-3 mt-2">
            <InsightBlock text={weekly} />
          </div>
        )}
      </div>

      {/* Ask AI */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-sm font-semibold text-white mb-1">💬 Ask Your Coach</p>
        <p className="text-xs text-gray-500 mb-3">Ask anything about your growth journey</p>

        {/* Quick question chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_QUESTIONS.map(q => (
            <button key={q} onClick={() => { setQuestion(q); handleAsk(q); }}
              disabled={askLoading}
              className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 px-3 py-1 rounded-full transition-colors">
              {q}
            </button>
          ))}
        </div>

        {/* Custom question */}
        <div className="flex gap-2">
          <input value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAsk(question)}
            placeholder="Ask a custom question…"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <button onClick={() => handleAsk(question)} disabled={askLoading || !question.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
            {askLoading ? "…" : "Ask"}
          </button>
        </div>

        {answer && (
          <div className="bg-purple-950/40 border border-purple-800/30 rounded-xl p-3 mt-3">
            <InsightBlock text={answer} />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
