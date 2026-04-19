"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

const ABI = [
  {
    name: "proofCount",
    type: "function",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "verifyProof",
    type: "function",
    inputs: [
      { name: "user",  type: "address" },
      { name: "hash",  type: "bytes32" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
] as const;

/**
 * useProofRegistry
 *
 * Reads the user's proof count from ProofRegistry and exposes a
 * verifyProof helper for on-demand hash verification.
 */
export function useProofRegistry() {
  const { address } = useAccount();
  // Always read from Celo mainnet — wallet chain doesn't affect read calls
  const registryAddress = CONTRACTS.celo.ProofRegistry;

  const { data: proofCount, isLoading } = useReadContract({
    address: registryAddress,
    abi: ABI,
    functionName: "proofCount",
    args: [address!],
    query: { enabled: !!address && !!registryAddress },
  });

  return {
    proofCount: proofCount ?? BigInt(0),
    isLoading,
    registryAddress,
  };
}
