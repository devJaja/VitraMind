"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useProofRegistry } from "@/hooks/useProofRegistry";
import { useZKStreak } from "@/hooks/useZKStreak";
import { useGrowthNFT } from "@/hooks/useGrowthNFT";
import { getLogStreak, getMoodAverage } from "@/lib/logStorage";

interface Props {
  onViewProofs?: () => void;
}

export function Dashboard({ onViewProofs }: Props) {
  const { isConnected, address } = useAccount();
  const { proofCount }  = useProofRegistry();
  const zkMilestones    = useZKStreak();
  const { level, streakDays, totalLogs } = useGrowthNFT();
  const [localStreak, setLocalStreak] = useState(0);
  const [moodAvg, setMoodAvg]         = useState(0);

  useEffect(() => {
    if (address) {
      setLocalStreak(getLogStreak(address));
      setMoodAvg(getMoodAverage(address, 7));
    }
  }, [address]);

  if (!isConnected) return null;

  const stats = [
    { label: "Total Proofs", value: proofCount.toString(), clickable: true },
    { label: "Growth Level", value: level != null ? `Level ${level}` : "—", clickable: false },
    { label: "Local Streak", value: `${localStreak}d`, clickable: false },
    { label: "7d Mood Avg",  value: moodAvg ? `${moodAvg}/5` : "—", clickable: false },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, clickable }) => (
          <div
            key={label}
            onClick={clickable && onViewProofs ? onViewProofs : undefined}
            className={`bg-gray-800 rounded-2xl p-4 ${clickable && onViewProofs ? "cursor-pointer hover:bg-gray-700 hover:ring-1 hover:ring-green-500 transition-all" : ""}`}
          >
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
            {clickable && onViewProofs && (
              <p className="text-xs text-green-500 mt-1">View all ↗</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-2xl p-4">
        <p className="text-xs text-gray-400 mb-2">ZK Streak Proofs</p>
        <div className="flex gap-3">
          {zkMilestones.map(({ milestone, proven }) => (
            <span key={milestone}
              className={`text-xs px-2 py-1 rounded-full font-medium ${proven ? "bg-green-500/20 text-green-400 ring-1 ring-green-500" : "bg-gray-700 text-gray-500"}`}>
              {proven ? "✓" : "○"} {milestone}d
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
