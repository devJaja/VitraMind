"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV, uintCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export function useAnalyticsRegistry() {
  const { stxAddress } = useStacksAuth();
  const [weeklySnapshot, setWeeklySnapshot]   = useState<{ digestHash: string; timestamp: number } | undefined>();
  const [monthlySnapshot, setMonthlySnapshot] = useState<{ digestHash: string; timestamp: number } | undefined>();

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.analyticsRegistry.split(".");

    for (const period of [0, 1] as const) {
      callReadOnlyFunction({
        contractAddress: addr, contractName: name,
        functionName: "latest-snapshot",
        functionArgs: [principalCV(stxAddress), uintCV(period)],
        network: NETWORK, senderAddress: stxAddress,
      }).then(cv => {
        const val = cvToValue(cv) as { value?: { "digest-hash"?: string; timestamp?: bigint } } | null;
        if (val?.value) {
          const snap = { digestHash: String(val.value["digest-hash"] ?? ""), timestamp: Number(val.value.timestamp ?? 0) };
          period === 0 ? setWeeklySnapshot(snap) : setMonthlySnapshot(snap);
        }
      }).catch(() => {});
    }
  }, [stxAddress]);

  return { weeklySnapshot, monthlySnapshot };
}
