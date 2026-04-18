"use client";

import { useAccount, useReadContract, useChainId } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { useProofRegistry } from "@/hooks/useProofRegistry";
import { useZKStreak } from "@/hooks/useZKStreak";

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

export function Dashboard({ growthNFTAddress }: Props) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = chainId === 42220 ? CONTRACTS.celo : CONTRACTS.alfajores;

  const { proofCount } = useProofRegistry();
  const zkMilestones   = useZKStreak();

  const { data: tokenId } = useReadContract({
    address: growthNFTAddress ?? contracts.GrowthNFT,
    abi:     GROWTH_NFT_ABI,
    functionName: "tokenOfOwner",
    args:    [address!],
    query:   { enabled: !!address },
  });

  const { data: growth } = useReadContract({
    address: growthNFTAddress ?? contracts.GrowthNFT,
    abi:     GROWTH_NFT_ABI,
    functionName: "growthData",
    args:    [tokenId!],
    query:   { enabled: !!tokenId && tokenId > BigInt(0) },
  });

  if (!isConnected) return null;

  const stats = [
    { label: "Total Proofs",  value: proofCount.toString() },
    { label: "Growth Level",  value: growth ? `Level ${growth[0]}` : "—" },
    { label: "Streak",        value: growth ? `${growth[1]}d` : "—" },
    { label: "Total Logs",    value: growth ? growth[2].toString() : "—" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* ZK streak milestones */}
      <div className="bg-gray-800 rounded-2xl p-4">
        <p className="text-xs text-gray-400 mb-2">ZK Streak Proofs</p>
        <div className="flex gap-3">
          {zkMilestones.map(({ milestone, proven }) => (
            <span
              key={milestone}
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                proven
                  ? "bg-green-500/20 text-green-400 ring-1 ring-green-500"
                  : "bg-gray-700 text-gray-500"
              }`}
            >
              {proven ? "✓" : "○"} {milestone}d
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
