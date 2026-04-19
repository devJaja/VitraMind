"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

const ABI = [
  {
    name: "rewards",
    type: "function",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "points",                type: "uint256" },
      { name: "claimedCUSD",           type: "uint256" },
      { name: "lastRewardAt",          type: "uint256" },
      { name: "highestStreakRewarded", type: "uint32"  },
    ],
    stateMutability: "view",
  },
  {
    name: "badges",
    type: "function",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
] as const;

/**
 * useRewards
 *
 * Reads the connected user's points, claimed cUSD, and highest streak rewarded
 * from the RewardsEngine contract.
 */
export function useRewards() {
  const { address } = useAccount();
  const rewardsAddress = CONTRACTS.celo.RewardsEngine;

  const { data, isLoading } = useReadContract({
    address: rewardsAddress,
    abi: ABI,
    functionName: "rewards",
    args: [address!],
    query: { enabled: !!address && !!rewardsAddress },
  });

  return {
    points:                data?.[0] ?? BigInt(0),
    claimedCUSD:           data?.[1] ?? BigInt(0),
    lastRewardAt:          data?.[2] ?? BigInt(0),
    highestStreakRewarded: data?.[3] ?? 0,
    isLoading,
  };
}
