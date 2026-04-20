"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export function useStreakVerifier() {
  const { stxAddress } = useStacksAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<number>();

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.streakVerifier.split(".");

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-streak-count",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => setStreakCount(Number(cvToValue(cv) ?? 0))).catch(() => {});

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "latest-streak",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => {
      const val = cvToValue(cv) as { value?: { "current-streak"?: bigint; "submitted-at"?: bigint } } | null;
      if (val?.value) {
        setCurrentStreak(Number(val.value["current-streak"] ?? 0));
        setLastSubmittedAt(Number(val.value["submitted-at"] ?? 0));
      }
    }).catch(() => {});
  }, [stxAddress]);

  return { currentStreak, streakCount, lastSubmittedAt };
}
