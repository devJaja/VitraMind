"use client";

import { useEffect, useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";
import { getLogs } from "@/lib/logStorage";

const MOOD_EMOJI = ["", "😞", "😕", "😐", "🙂", "😄"];
const MOOD_COLOR = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

export function MoodChart() {
  const { stxAddress: address } = useStacksAuth();
  const [data, setData] = useState<{ date: string; mood: number }[]>([]);

  useEffect(() => {
    if (!address) return;
    const logs = getLogs(address).slice(-14);
    setData(logs.map(l => ({
      date: new Date(l.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      mood: l.mood,
    })));
  }, [address]);

  if (!data.length) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Mood — Last {data.length} entries</p>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-sm ${MOOD_COLOR[d.mood]} opacity-80 transition-all`}
              style={{ height: `${(d.mood / 5) * 100}%` }}
              title={`${d.date}: ${MOOD_EMOJI[d.mood]} ${d.mood}/5`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-600">{data[0]?.date}</span>
        <span className="text-xs text-gray-600">{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
