"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export interface RewardState {
  pending: number;   // micro-STX
  claimed: number;   // micro-STX
}

export function useRewardVault() {
  const { stxAddress } = useStacksAuth();
  const [rewards, setRewards] = useState<RewardState>({ pending: 0, claimed: 0 });

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.rewardVault.split(".");

    Promise.all([
      callReadOnlyFunction({
        contractAddress: addr, contractName: name,
        functionName: "get-pending",
        functionArgs: [principalCV(stxAddress)],
        network: NETWORK, senderAddress: stxAddress,
      }),
      callReadOnlyFunction({
        contractAddress: addr, contractName: name,
        functionName: "get-claimed",
        functionArgs: [principalCV(stxAddress)],
        network: NETWORK, senderAddress: stxAddress,
      }),
    ]).then(([p, c]) => {
      setRewards({
        pending: Number(cvToValue(p) ?? 0),
        claimed: Number(cvToValue(c) ?? 0),
      });
    }).catch(() => {});
  }, [stxAddress]);

  return { rewards };
}
