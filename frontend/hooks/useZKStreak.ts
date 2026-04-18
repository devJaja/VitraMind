"use client";

import { useAccount, useReadContract, useChainId } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

const ABI = [
  {
    name: "hasProvenStreak",
    type: "function",
    inputs: [
      { name: "user",       type: "address" },
      { name: "minStreak",  type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
] as const;

/** Streak milestone thresholds matching RewardsEngine */
export const STREAK_MILESTONES = [7, 30, 100] as const;

/**
 * useZKStreak
 *
 * Checks whether the connected user has submitted a valid ZK proof
 * for each streak milestone (7 / 30 / 100 days).
 */
export function useZKStreak() {
  const { address } = useAccount();
  const chainId = useChainId();
  const zkAddress = (chainId === 42220 ? CONTRACTS.celo : CONTRACTS.alfajores).ZKStreakVerifier;

  const results = STREAK_MILESTONES.map((milestone) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data } = useReadContract({
      address: zkAddress,
      abi: ABI,
      functionName: "hasProvenStreak",
      args: [address!, BigInt(milestone)],
      query: { enabled: !!address && !!zkAddress },
    });
    return { milestone, proven: data ?? false };
  });

  return results;
}
