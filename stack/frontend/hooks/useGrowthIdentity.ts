"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export function useGrowthIdentity() {
  const { stxAddress } = useStacksAuth();
  const [hasIdentity, setHasIdentity]   = useState(false);
  const [growthLevel, setGrowthLevel]   = useState(0);
  const [publishedAt, setPublishedAt]   = useState<number>();
  const [appCount, setAppCount]         = useState(0);

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.growthIdentity.split(".");

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "has-active-identity",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => setHasIdentity(Boolean(cvToValue(cv)))).catch(() => {});

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-identity",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => {
      const v = cvToValue(cv) as { value?: Record<string, unknown> } | null;
      if (v?.value) {
        setGrowthLevel(Number(v.value["growth-level"] ?? 0));
        setPublishedAt(Number(v.value["published-at"] ?? 0));
      }
    }).catch(() => {});

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-app-count",
      functionArgs: [],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => setAppCount(Number(cvToValue(cv) ?? 0))).catch(() => {});
  }, [stxAddress]);

  return { hasIdentity, growthLevel, publishedAt, appCount };
}
