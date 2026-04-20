"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export function useProofRegistry() {
  const { stxAddress } = useStacksAuth();
  const [proofCount, setProofCount] = useState(0);

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.proofRegistry.split(".");
    callReadOnlyFunction({
      contractAddress: addr,
      contractName: name,
      functionName: "get-proof-count",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK,
      senderAddress: stxAddress,
    }).then(cv => {
      const val = cvToValue(cv);
      setProofCount(typeof val === "bigint" ? Number(val) : Number(val ?? 0));
    }).catch(() => {});
  }, [stxAddress]);

  return { proofCount };
}
