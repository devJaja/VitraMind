"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getLogs, deleteLog, exportLogs, type LogEntry } from "@/lib/logStorage";

const MOODS = ["", "😞", "😕", "😐", "🙂", "😄"];

function LogCard({ entry, onDelete }: { entry: LogEntry; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const date = new Date(entry.date);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{MOODS[entry.mood]}</span>
          <div>
            <p className="text-sm font-medium text-white">
              {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-[180px]">
              {entry.habits || entry.reflection || "No details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {entry.insight && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">AI ✨</span>}
          {entry.logTxHash && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">On-chain ✓</span>}
          <span className="text-gray-600 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
          {entry.habits && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Habits</p>
              <p className="text-sm text-gray-300">{entry.habits}</p>
            </div>
          )}
          {entry.reflection && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Reflection</p>
              <p className="text-sm text-gray-300">{entry.reflection}</p>
            </div>
          )}
          {entry.insight && (
            <div className="bg-purple-950/40 border border-purple-800/30 rounded-xl p-3">
              <p className="text-xs text-purple-400 mb-2">✨ AI Insight</p>
              <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{entry.insight}</p>
            </div>
          )}
          <div className="flex gap-3 flex-wrap items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              {entry.logTxHash && (
                <a href={`https://celoscan.io/tx/${entry.logTxHash}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-green-500 hover:text-green-400 underline">Log tx ↗</a>
              )}
              {entry.insightTxHash && (
                <a href={`https://celoscan.io/tx/${entry.insightTxHash}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 underline">Insight tx ↗</a>
              )}
            </div>
            <button onClick={onDelete} className="text-xs text-red-500/60 hover:text-red-400 transition-colors">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryTab({ refreshKey }: { refreshKey?: number }) {
  const { address } = useAccount();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  function reload() {
    if (address) setLogs([...getLogs(address)].reverse());
  }

  useEffect(() => { reload(); }, [address, refreshKey]);

  if (!address) return null;

  if (logs.length === 0) return (
    <div className="text-center py-10">
      <p className="text-3xl mb-2">📔</p>
      <p className="text-gray-500 text-sm">No logs yet. Submit your first entry!</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">{logs.length} entr{logs.length === 1 ? "y" : "ies"} saved locally</p>
        <button onClick={() => {
          const blob = new Blob([exportLogs(address)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url;
          a.download = `vitramind_logs_${new Date().toISOString().slice(0,10)}.json`;
          a.click(); URL.revokeObjectURL(url);
        }} className="text-xs text-gray-500 hover:text-green-400 transition-colors">
          Export JSON ↓
        </button>
      </div>
      {logs.map(entry => (
        <LogCard key={entry.id} entry={entry} onDelete={() => {
          deleteLog(address, entry.id);
          reload();
        }} />
      ))}
    </div>
  );
}
