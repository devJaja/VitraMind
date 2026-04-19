"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

const ABI = [{
  name: "latestExport", type: "function",
  inputs: [{ name: "user", type: "address" }],
  outputs: [{
    type: "tuple",
    components: [
      { name: "cid",         type: "string"  },
      { name: "contentHash", type: "bytes32" },
      { name: "exportType",  type: "uint8"   },
      { name: "timestamp",   type: "uint256" },
    ],
  }],
  stateMutability: "view",
}, {
  name: "exportCount", type: "function",
  inputs: [{ name: "user", type: "address" }],
  outputs: [{ type: "uint256" }],
  stateMutability: "view",
}] as const;

const EXPORT_TYPES = ["FULL", "LOGS", "INSIGHTS", "ANALYTICS"] as const;

export function useIPFSExport() {
  const { address } = useAccount();
  const addr = CONTRACTS.celo.IPFSExportRegistry;

  const { data: latest } = useReadContract({
    address: addr, abi: ABI, functionName: "latestExport",
    args: [address!], query: { enabled: !!address && !!addr },
  });

  const { data: count } = useReadContract({
    address: addr, abi: ABI, functionName: "exportCount",
    args: [address!], query: { enabled: !!address && !!addr },
  });

  const entry = latest as { cid: string; contentHash: string; exportType: number; timestamp: bigint } | undefined;

  return {
    latestCID:    entry?.cid,
    exportType:   entry ? EXPORT_TYPES[entry.exportType] : undefined,
    exportedAt:   entry?.timestamp,
    exportCount:  count ?? BigInt(0),
  };
}
