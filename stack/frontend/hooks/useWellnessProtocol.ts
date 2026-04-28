"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV, uintCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export function useWellnessProtocol() {
  const { stxAddress } = useStacksAuth();
  const [protocolCount, setProtocolCount] = useState(0);

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.wellnessProtocol.split(".");
    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-protocol-count",
      functionArgs: [],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => setProtocolCount(Number(cvToValue(cv) ?? 0))).catch(() => {});
  }, [stxAddress]);

  async function isOptedIn(protocolId: number): Promise<boolean> {
    if (!stxAddress) return false;
    const [addr, name] = CONTRACTS.wellnessProtocol.split(".");
    try {
      const cv = await callReadOnlyFunction({
        contractAddress: addr, contractName: name,
        functionName: "is-opted-in",
        functionArgs: [uintCV(protocolId), principalCV(stxAddress)],
        network: NETWORK, senderAddress: stxAddress,
      });
      return Boolean(cvToValue(cv));
    } catch { return false; }
  }

  return { protocolCount, isOptedIn };
}
