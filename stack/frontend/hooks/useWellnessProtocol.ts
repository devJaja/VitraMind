"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV, uintCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export function useWellnessProtocol(protocolId = 0) {
  const { stxAddress } = useStacksAuth();
  const [isOptedIn, setIsOptedIn]         = useState(false);
  const [protocolCount, setProtocolCount] = useState(0);

  useEffect(() => {
    const [addr, name] = CONTRACTS.wellnessProtocol.split(".");

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-protocol-count",
      functionArgs: [],
      network: NETWORK, senderAddress: addr,
    }).then(cv => setProtocolCount(Number(cvToValue(cv) ?? 0))).catch(() => {});

    if (!stxAddress) return;
    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "is-opted-in",
      functionArgs: [uintCV(protocolId), principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => setIsOptedIn(Boolean(cvToValue(cv)))).catch(() => {});
  }, [stxAddress, protocolId]);

  return { isOptedIn, protocolCount };
}
