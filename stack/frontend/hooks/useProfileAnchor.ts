"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export function useProfileAnchor() {
  const { stxAddress } = useStacksAuth();
  const [hasProfile, setHasProfile]   = useState(false);
  const [profileHash, setProfileHash] = useState<string>();
  const [updatedAt, setUpdatedAt]     = useState<number>();

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.profileAnchor.split(".");

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "has-profile",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => setHasProfile(Boolean(cvToValue(cv)))).catch(() => {});

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-profile-hash",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => {
      const v = cvToValue(cv);
      if (v) setProfileHash(String(v));
    }).catch(() => {});

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-updated-at",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => setUpdatedAt(Number(cvToValue(cv) ?? 0))).catch(() => {});
  }, [stxAddress]);

  return { hasProfile, profileHash, updatedAt };
}
