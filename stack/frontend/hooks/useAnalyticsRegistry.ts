"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export function useAnalyticsRegistry() {
  const { stxAddress } = useStacksAuth();
  const [snapshotCount, setSnapshotCount] = useState(0);

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.analyticsRegistry.split(".");
    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-snapshot-count",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => setSnapshotCount(Number(cvToValue(cv) ?? 0))).catch(() => {});
  }, [stxAddress]);

  return { snapshotCount };
}
