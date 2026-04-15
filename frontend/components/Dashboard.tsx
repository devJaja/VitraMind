"use client";

import { useAccount, useReadContract } from "wagmi";

const PROOF_REGISTRY_ABI = [
  {
    name: "proofCount",
    type: "function",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const GROWTH_NFT_ABI = [
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

interface Props {
  proofRegistryAddress?: `0x${string}`;
  growthNFTAddress?:     `0x${string}`;
}

export function Dashboard({ proofRegistryAddress, growthNFTAddress }: Props) {
  const { address, isConnected } = useAccount();

  const { data: proofCount } = useReadContract({
    address: proofRegistryAddress,
    abi:     PROOF_REGISTRY_ABI,
    functionName: "proofCount",
    args:    [address!],
    query:   { enabled: !!address && !!proofRegistryAddress },
  });

  const { data: tokenId } = useReadContract({
    address: growthNFTAddress,
    abi:     GROWTH_NFT_ABI,
    functionName: "tokenOfOwner",
    args:    [address!],
    query:   { enabled: !!address && !!growthNFTAddress },
  });

  const { data: growth } = useReadContract({
    address: growthNFTAddress,
    abi:     GROWTH_NFT_ABI,
    functionName: "growthData",
    args:    [tokenId!],
    query:   { enabled: !!tokenId && tokenId > BigInt(0) },
  });

  if (!isConnected) return null;

  const stats = [
    { label: "Total Proofs",  value: proofCount?.toString() ?? "—" },
    { label: "Growth Level",  value: growth ? `Level ${growth[0]}` : "—" },
    { label: "Streak",        value: growth ? `${growth[1]}d` : "—" },
    { label: "Total Logs",    value: growth ? growth[2].toString() : "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(({ label, value }) => (
        <div key={label} className="bg-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}
