"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV, uintCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export interface GoalEntry {
  commitment: string;
  status: number; // 0=active 1=completed 2=abandoned
  createdAt: number;
  updatedAt: number;
}

export function useGoalTracker() {
  const { stxAddress } = useStacksAuth();
  const [goalCount, setGoalCount] = useState(0);
  const [goals, setGoals] = useState<GoalEntry[]>([]);

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.goalTracker.split(".");

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-goal-count",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => {
      const count = Number(cvToValue(cv) ?? 0);
      setGoalCount(count);
      return Promise.all(
        Array.from({ length: count }, (_, i) =>
          callReadOnlyFunction({
            contractAddress: addr, contractName: name,
            functionName: "get-goal",
            functionArgs: [principalCV(stxAddress), uintCV(i)],
            network: NETWORK, senderAddress: stxAddress,
          })
        )
      );
    }).then(results => {
      const parsed: GoalEntry[] = results.map(cv => {
        const v = cvToValue(cv) as { value?: Record<string, bigint> } | null;
        if (!v?.value) return null;
        return {
          commitment: String(v.value["commitment"] ?? ""),
          status: Number(v.value["status"] ?? 0),
          createdAt: Number(v.value["created-at"] ?? 0),
          updatedAt: Number(v.value["updated-at"] ?? 0),
        };
      }).filter(Boolean) as GoalEntry[];
      setGoals(parsed);
    }).catch(() => {});
  }, [stxAddress]);

  return { goalCount, goals };
}
