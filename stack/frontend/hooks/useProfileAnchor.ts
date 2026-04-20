"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

const network = NETWORK;

export function useProfileAnchor() {
  const { stxAddress } = useStacksAuth();
  const [hasProfile, setHasProfile] = useState(false);
  const [profileHash, setProfileHash] = useState<string>();

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.profileAnchor.split(".");
    callReadOnlyFunction({
      contractAddress: addr,
      contractName: name,
      functionName: "get-profile-hash",
      functionArgs: [principalCV(stxAddress)],
      network,
      senderAddress: stxAddress,
    }).then(cv => {
      const val = cvToValue(cv);
      if (val !== null && val !== undefined) {
        setHasProfile(true);
        setProfileHash(typeof val === "string" ? val : JSON.stringify(val));
      }
    }).catch(() => {});
  }, [stxAddress]);

  return { hasProfile, profileHash };
}
