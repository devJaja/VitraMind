"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

const ABI = [
  {
    name: "tokenOfOwner",
    type: "function",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "growthData",
    type: "function",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "level",       type: "uint8"   },
      { name: "streakDays",  type: "uint32"  },
      { name: "totalLogs",   type: "uint32"  },
      { name: "mintedAt",    type: "uint256" },
      { name: "metadataURI", type: "string"  },
    ],
    stateMutability: "view",
  },
] as const;

/**
 * useGrowthNFT
 *
 * Returns the connected user's GrowthNFT data: tokenId, level,
 * streakDays, totalLogs, mintedAt, and metadataURI.
 */
export function useGrowthNFT() {
  const { address } = useAccount();
  const nftAddress = CONTRACTS.celo.GrowthNFT;

  const { data: tokenId } = useReadContract({
    address: nftAddress,
    abi: ABI,
    functionName: "tokenOfOwner",
    args: [address!],
    query: { enabled: !!address && !!nftAddress },
  });

  const { data: growth, isLoading } = useReadContract({
    address: nftAddress,
    abi: ABI,
    functionName: "growthData",
    args: [tokenId!],
    query: { enabled: !!tokenId && tokenId > BigInt(0) },
  });

  return {
    tokenId,
    level:       growth?.[0],
    streakDays:  growth?.[1],
    totalLogs:   growth?.[2],
    mintedAt:    growth?.[3],
    metadataURI: growth?.[4],
    hasMinted:   !!tokenId && tokenId > BigInt(0),
    isLoading,
  };
}
