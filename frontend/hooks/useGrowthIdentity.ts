"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

const ABI = [{
  name: "hasActiveIdentity", type: "function",
  inputs: [{ name: "user", type: "address" }],
  outputs: [{ type: "bool" }],
  stateMutability: "view",
}, {
  name: "identities", type: "function",
  inputs: [{ name: "", type: "address" }],
  outputs: [
    { name: "commitment",  type: "bytes32" },
    { name: "growthLevel", type: "uint8"   },
    { name: "publishedAt", type: "uint256" },
    { name: "active",      type: "bool"    },
  ],
  stateMutability: "view",
}] as const;

export function useGrowthIdentity() {
  const { address } = useAccount();
  const addr = CONTRACTS.celo.GrowthIdentity;

  const { data: hasIdentity } = useReadContract({
    address: addr, abi: ABI, functionName: "hasActiveIdentity",
    args: [address!], query: { enabled: !!address && !!addr },
  });

  const { data: identity } = useReadContract({
    address: addr, abi: ABI, functionName: "identities",
    args: [address!], query: { enabled: !!address && !!addr },
  });

  return {
    hasIdentity: hasIdentity ?? false,
    growthLevel: identity?.[1],
    publishedAt: identity?.[2],
    active:      identity?.[3],
  };
}
