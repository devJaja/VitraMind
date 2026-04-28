import { useEffect, useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";
import { useProofRegistry } from "@/hooks/useProofRegistry";
import { getLogStreak, getMoodAverage, getBestStreak, getTotalReflectionWords } from "@/lib/logStorage";
import { growthTierLabel } from "@/lib/format";

interface Props { onViewProofs?: () => void; }

export function Dashboard({ onViewProofs }: Props) {
  const { isConnected, stxAddress } = useStacksAuth();
  const { proofCount } = useProofRegistry();
  const [localStreak, setLocalStreak] = useState(0);
  const [bestStreak, setBestStreak]   = useState(0);
  const [moodAvg, setMoodAvg]         = useState(0);
  const [words, setWords]             = useState(0);

  useEffect(() => {
    if (stxAddress) {
      setLocalStreak(getLogStreak(stxAddress));
      setBestStreak(getBestStreak(stxAddress));
      setMoodAvg(getMoodAverage(stxAddress, 7));
      setWords(getTotalReflectionWords(stxAddress));
    }
  }, [stxAddress]);

  if (!isConnected) return null;

  const tier = growthTierLabel(Math.min(localStreak, 100));

  const stats = [
    { label: "On-chain Proofs", value: proofCount.toString(), clickable: true },
    { label: "Current Streak",  value: `${localStreak}d 🔥`, clickable: false },
    { label: "Best Streak",     value: `${bestStreak}d 🏆`, clickable: false },
    { label: "7d Mood Avg",     value: moodAvg ? `${moodAvg}/5` : "—", clickable: false },
    { label: "Words Written",   value: words.toLocaleString(), clickable: false },
    { label: "Growth Tier",     value: tier, clickable: false },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, clickable }) => (
          <div key={label}
            onClick={clickable && onViewProofs ? onViewProofs : undefined}
            className={`bg-gray-800 rounded-2xl p-4 ${clickable && onViewProofs ? "cursor-pointer hover:bg-gray-700 hover:ring-1 hover:ring-orange-500 transition-all" : ""}`}>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-base font-bold text-white leading-tight">{value}</p>
            {clickable && onViewProofs && <p className="text-xs text-orange-500 mt-1">View all ↗</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
