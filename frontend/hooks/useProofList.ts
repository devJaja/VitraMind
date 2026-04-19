"use client";

import { useAccount, useReadContracts } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { useProofRegistry } from "./useProofRegistry";

const ADDRESS = CONTRACTS.celo.ProofRegistry;
const PROOF_TYPES = ["LOG", "INSIGHT", "STREAK", "ACHIEVEMENT"] as const;

const GET_PROOF_ABI = [{
  name: "getProof",
  type: "function",
  inputs: [{ name: "user", type: "address" }, { name: "index", type: "uint256" }],
  outputs: [{
    type: "tuple",
    components: [
      { name: "hash",      type: "bytes32" },
      { name: "proofType", type: "uint8"   },
      { name: "timestamp", type: "uint256" },
    ],
  }],
  stateMutability: "view",
}] as const;

export function useProofList() {
  const { address } = useAccount();
  const { proofCount } = useProofRegistry();

  const count = Number(proofCount);

  const { data, isLoading } = useReadContracts({
    contracts: Array.from({ length: count }, (_, i) => ({
      address: ADDRESS,
      abi: GET_PROOF_ABI,
      functionName: "getProof" as const,
      args: [address!, BigInt(i)] as [`0x${string}`, bigint],
    })),
    query: { enabled: !!address && count > 0 },
  });

  const proofs = (data ?? []).map((r, i) => {
    const p = r.result as { hash: `0x${string}`; proofType: number; timestamp: bigint } | undefined;
    return {
      index: i,
      hash:      p?.hash ?? "0x",
      proofType: PROOF_TYPES[p?.proofType ?? 0],
      timestamp: p ? new Date(Number(p.timestamp) * 1000).toLocaleString() : "—",
    };
  });

  return { proofs, isLoading, count };
}
