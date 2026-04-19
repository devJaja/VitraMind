"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

const ABI = [{
  name: "latestStreak", type: "function",
  inputs: [{ name: "user", type: "address" }],
  outputs: [{
    type: "tuple",
    components: [
      { name: "proofHash",    type: "bytes32" },
      { name: "currentStreak", type: "uint32" },
      { name: "submittedAt",  type: "uint256" },
    ],
  }],
  stateMutability: "view",
}, {
  name: "streakCount", type: "function",
  inputs: [{ name: "user", type: "address" }],
  outputs: [{ type: "uint256" }],
  stateMutability: "view",
}] as const;

export function useStreakVerifier() {
  const { address } = useAccount();
  const addr = CONTRACTS.celo.StreakVerifier;

  const { data: latest } = useReadContract({
    address: addr, abi: ABI, functionName: "latestStreak",
    args: [address!], query: { enabled: !!address && !!addr },
  });

  const { data: count } = useReadContract({
    address: addr, abi: ABI, functionName: "streakCount",
    args: [address!], query: { enabled: !!address && !!addr },
  });

  const entry = latest as { proofHash: string; currentStreak: number; submittedAt: bigint } | undefined;

  return {
    currentStreak: entry?.currentStreak ?? 0,
    lastSubmittedAt: entry?.submittedAt,
    streakCount: count ?? BigInt(0),
  };
}
