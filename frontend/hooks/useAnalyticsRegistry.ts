"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

const ABI = [{
  name: "latestSnapshot", type: "function",
  inputs: [{ name: "user", type: "address" }, { name: "period", type: "uint8" }],
  outputs: [{
    type: "tuple",
    components: [
      { name: "digestHash", type: "bytes32" },
      { name: "period",     type: "uint8"   },
      { name: "timestamp",  type: "uint256" },
    ],
  }],
  stateMutability: "view",
}] as const;

export function useAnalyticsRegistry() {
  const { address } = useAccount();
  const addr = CONTRACTS.celo.AnalyticsRegistry;

  const { data: weekly } = useReadContract({
    address: addr, abi: ABI, functionName: "latestSnapshot",
    args: [address!, 0], query: { enabled: !!address && !!addr },
  });

  const { data: monthly } = useReadContract({
    address: addr, abi: ABI, functionName: "latestSnapshot",
    args: [address!, 1], query: { enabled: !!address && !!addr },
  });

  type Snap = { digestHash: string; period: number; timestamp: bigint };
  return {
    weeklySnapshot:  weekly  as Snap | undefined,
    monthlySnapshot: monthly as Snap | undefined,
  };
}
