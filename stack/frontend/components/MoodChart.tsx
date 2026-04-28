"use client";

import { useEffect, useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";
import { getLogs, getMoodDistribution } from "@/lib/logStorage";

const MOOD_EMOJI  = ["", "😞", "😕", "😐", "🙂", "😄"];
const MOOD_COLOR  = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
const MOOD_LABEL  = ["", "Rough", "Low", "Okay", "Good", "Great"];

export function MoodChart() {
  const { stxAddress: address } = useStacksAuth();
  const [data, setData]   = useState<{ date: string; mood: number }[]>([]);
  const [dist, setDist]   = useState<Record<number, number>>({});
  const [view, setView]   = useState<"trend" | "dist">("trend");

  useEffect(() => {
    if (!address) return;
    const logs = getLogs(address).slice(-14);
    setData(logs.map(l => ({
      date: new Date(l.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      mood: l.mood,
    })));
    setDist(getMoodDistribution(address));
  }, [address]);

  if (!data.length) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mood</p>
        <div className="flex gap-1">
          {(["trend", "dist"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`text-xs px-2 py-0.5 rounded-full transition-all ${view === v ? "bg-orange-500 text-black font-semibold" : "text-gray-500 hover:text-gray-300"}`}>
              {v === "trend" ? "Trend" : "Dist"}
            </button>
          ))}
        </div>
      </div>

      {view === "trend" && (
        <>
          <div className="flex items-end gap-1.5 h-16">
            {data.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-t-sm ${MOOD_COLOR[d.mood]} opacity-80 transition-all`}
                  style={{ height: `${(d.mood / 5) * 100}%` }}
                  title={`${d.date}: ${MOOD_EMOJI[d.mood]} ${d.mood}/5`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-600">{data[0]?.date}</span>
            <span className="text-xs text-gray-600">{data[data.length - 1]?.date}</span>
          </div>
        </>
      )}

      {view === "dist" && (
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map(m => (
            <div key={m} className="flex items-center gap-2">
              <span className="text-sm w-5">{MOOD_EMOJI[m]}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full ${MOOD_COLOR[m]}`} style={{ width: `${dist[m] ?? 0}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{dist[m] ?? 0}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
