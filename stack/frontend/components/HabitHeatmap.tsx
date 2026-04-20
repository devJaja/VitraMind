"use client";

import { useEffect, useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";
import { getLogs } from "@/lib/logStorage";

export function HabitHeatmap() {
  const { stxAddress: address } = useStacksAuth();
  const [cells, setCells] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    if (!address) return;
    const logs = getLogs(address);
    const map: Record<string, number> = {};
    logs.forEach(l => {
      const d = l.date.slice(0, 10);
      map[d] = (map[d] ?? 0) + 1;
    });
    // Last 28 days
    const result = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      result.push({ date: d, count: map[d] ?? 0 });
    }
    setCells(result);
  }, [address]);

  if (!cells.length) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity — Last 28 Days</p>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, count }) => (
          <div key={date} title={`${date}: ${count} log${count !== 1 ? "s" : ""}`}
            className={`h-6 rounded-sm transition-colors ${
              count === 0 ? "bg-gray-800" :
              count === 1 ? "bg-green-900" :
              count === 2 ? "bg-green-700" : "bg-green-500"
            }`} />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-600">4 weeks ago</span>
        <span className="text-xs text-gray-600">Today</span>
      </div>
    </div>
  );
}
