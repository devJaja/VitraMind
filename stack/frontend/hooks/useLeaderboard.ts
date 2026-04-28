"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export interface LeaderboardEntry {
  alias: string;
  streak: number;
  points: number;
  updatedAt: number;
}

export function useLeaderboard() {
  const { stxAddress } = useStacksAuth();
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.leaderboard.split(".");
    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-entry",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => {
      const v = cvToValue(cv) as { value?: Record<string, unknown> } | null;
      if (!v?.value) { setMyEntry(null); return; }
      setMyEntry({
        alias:     String(v.value["alias"] ?? ""),
        streak:    Number(v.value["streak"] ?? 0),
        points:    Number(v.value["points"] ?? 0),
        updatedAt: Number(v.value["updated-at"] ?? 0),
      });
    }).catch(() => {});
  }, [stxAddress]);

  return { myEntry };
}
