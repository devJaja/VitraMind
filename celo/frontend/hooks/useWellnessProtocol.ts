"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

const ABI = [{
  name: "optedIn", type: "function",
  inputs: [{ name: "", type: "uint256" }, { name: "", type: "address" }],
  outputs: [{ type: "bool" }],
  stateMutability: "view",
}, {
  name: "protocolCount", type: "function",
  inputs: [],
  outputs: [{ type: "uint256" }],
  stateMutability: "view",
}, {
  name: "protocols", type: "function",
  inputs: [{ name: "", type: "uint256" }],
  outputs: [
    { name: "name",      type: "string"  },
    { name: "schemaCID", type: "string"  },
    { name: "creator",   type: "address" },
    { name: "active",    type: "bool"    },
    { name: "createdAt", type: "uint256" },
  ],
  stateMutability: "view",
}] as const;

export function useWellnessProtocol(protocolId = 0) {
  const { address } = useAccount();
  const addr = CONTRACTS.celo.WellnessProtocol;

  const { data: isOptedIn } = useReadContract({
    address: addr, abi: ABI, functionName: "optedIn",
    args: [BigInt(protocolId), address!],
    query: { enabled: !!address && !!addr },
  });

  const { data: count } = useReadContract({
    address: addr, abi: ABI, functionName: "protocolCount",
    query: { enabled: !!addr },
  });

  const { data: protocol } = useReadContract({
    address: addr, abi: ABI, functionName: "protocols",
    args: [BigInt(protocolId)],
    query: { enabled: !!addr },
  });

  return {
    isOptedIn: isOptedIn ?? false,
    protocolCount: count ?? BigInt(0),
    protocol: protocol ? { name: protocol[0], schemaCID: protocol[1], active: protocol[3] } : undefined,
  };
}
