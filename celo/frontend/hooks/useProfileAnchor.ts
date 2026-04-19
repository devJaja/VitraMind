"use client";

import { useAccount, useReadContract, useChainId } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

const ABI = [
  {
    name: "hasProfile",
    type: "function",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "profileHash",
    type: "function",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "bytes32" }],
    stateMutability: "view",
  },
] as const;

/**
 * useProfileAnchor
 *
 * Checks whether the connected user has anchored a profile commitment
 * and returns their current profile hash.
 */
export function useProfileAnchor() {
  const { address } = useAccount();
  const chainId = useChainId();
  const anchorAddress = (chainId === 42220 ? CONTRACTS.celo : CONTRACTS.alfajores).ProfileAnchor;

  const { data: hasProfile } = useReadContract({
    address: anchorAddress,
    abi: ABI,
    functionName: "hasProfile",
    args: [address!],
    query: { enabled: !!address && !!anchorAddress },
  });

  const { data: profileHash } = useReadContract({
    address: anchorAddress,
    abi: ABI,
    functionName: "profileHash",
    args: [address!],
    query: { enabled: !!address && !!anchorAddress },
  });

  return { hasProfile: hasProfile ?? false, profileHash };
}
