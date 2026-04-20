"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export function useGrowthIdentity() {
  const { stxAddress } = useStacksAuth();
  const [hasIdentity, setHasIdentity]   = useState(false);
  const [growthLevel, setGrowthLevel]   = useState<number>();
  const [publishedAt, setPublishedAt]   = useState<number>();

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.growthIdentity.split(".");
    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-identity",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => {
      const val = cvToValue(cv) as { "growth-level"?: bigint; "published-at"?: bigint; active?: boolean } | null;
      if (val && val.active) {
        setHasIdentity(true);
        setGrowthLevel(Number(val["growth-level"] ?? 0));
        setPublishedAt(Number(val["published-at"] ?? 0));
      }
    }).catch(() => {});
  }, [stxAddress]);

  return { hasIdentity, growthLevel, publishedAt };
}
