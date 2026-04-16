"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { keccak256, encodePacked } from "viem";
import { useMiniPayCUSD } from "@/hooks/useMiniPayCUSD";

const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

/**
 * DailyLogForm
 *
 * Lets the user log mood (1-5), habits, and a reflection.
 * On submit, hashes the log locally and anchors the proof on-chain
 * via ProofRegistry.submitProof().
 *
 * Raw data never leaves the device — only the keccak256 hash is sent on-chain.
 */
export function DailyLogForm({ proofRegistryAddress }: { proofRegistryAddress?: `0x${string}` }) {
  const { address, isConnected } = useAccount();
  const { writeContract } = useMiniPayCUSD();

  const [mood, setMood]           = useState(3);
  const [habits, setHabits]       = useState("");
  const [reflection, setReflection] = useState("");
  const [status, setStatus]       = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [txHash, setTxHash]       = useState<string>();

  const PROOF_REGISTRY_ABI = [
    {
      name: "submitProof",
      type: "function",
      inputs: [
        { name: "hash",      type: "bytes32" },
        { name: "proofType", type: "uint8"   },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !proofRegistryAddress) return;

    setStatus("submitting");
    try {
      // Hash the log locally — raw data stays on device
      const logPayload = encodePacked(
        ["address", "uint8", "string", "string", "uint256"],
        [address!, mood, habits, reflection, BigInt(Date.now())]
      );
      const logHash = keccak256(logPayload);

      // Uses cUSD as feeCurrency inside MiniPay, plain tx elsewhere
      const hash = await writeContract({
        address: proofRegistryAddress,
        abi:     PROOF_REGISTRY_ABI,
        functionName: "submitProof",
        args:    [logHash, 0], // 0 = ProofType.LOG
      });

      setTxHash(hash);
      setStatus("done");
      setMood(3);
      setHabits("");
      setReflection("");
    } catch {
      setStatus("error");
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center text-gray-400 py-12">
        Connect your wallet to start logging.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mood */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          How are you feeling today?
        </label>
        <div className="flex gap-3">
          {MOODS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setMood(i + 1)}
              className={`text-2xl p-2 rounded-xl transition-all ${
                mood === i + 1
                  ? "bg-green-500/20 ring-2 ring-green-500 scale-110"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Habits */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Habits completed today
        </label>
        <input
          type="text"
          value={habits}
          onChange={(e) => setHabits(e.target.value)}
          placeholder="e.g. meditation, exercise, reading"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Reflection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Daily reflection
        </label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What did you learn or feel today?"
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors"
      >
        {status === "submitting" ? "Anchoring proof…" : "Submit & Anchor Proof"}
      </button>

      {status === "done" && (
        <p className="text-green-400 text-sm text-center">
          ✓ Proof anchored on Celo{" "}
          {txHash && (
            <a
              href={`https://celoscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View tx
            </a>
          )}
        </p>
      )}
      {status === "error" && (
        <p className="text-red-400 text-sm text-center">
          Transaction failed. Please try again.
        </p>
      )}
    </form>
  );
}
