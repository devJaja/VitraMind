"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { keccak256, encodePacked } from "viem";
import { useMiniPayCUSD } from "@/hooks/useMiniPayCUSD";
import { CONTRACTS } from "@/lib/contracts";

const C = CONTRACTS.celo;

const PROFILE_ABI = [{
  name: "anchorProfile", type: "function",
  inputs: [{ name: "hash", type: "bytes32" }],
  outputs: [], stateMutability: "nonpayable",
}] as const;

const STREAK_ABI = [{
  name: "anchorStreak", type: "function",
  inputs: [
    { name: "user", type: "address" },
    { name: "proofHash", type: "bytes32" },
    { name: "currentStreak", type: "uint32" },
  ],
  outputs: [], stateMutability: "nonpayable",
}] as const;

const EXPORT_ABI = [{
  name: "anchorExport", type: "function",
  inputs: [
    { name: "cid", type: "string" },
    { name: "contentHash", type: "bytes32" },
    { name: "exportType", type: "uint8" },
  ],
  outputs: [], stateMutability: "nonpayable",
}] as const;

const IDENTITY_ABI = [{
  name: "publishIdentity", type: "function",
  inputs: [
    { name: "commitment", type: "bytes32" },
    { name: "growthLevel", type: "uint8" },
  ],
  outputs: [], stateMutability: "nonpayable",
}] as const;

const WELLNESS_OPT_ABI = [{
  name: "optIn", type: "function",
  inputs: [{ name: "protocolId", type: "uint256" }],
  outputs: [], stateMutability: "nonpayable",
}] as const;

const WELLNESS_PROGRESS_ABI = [{
  name: "commitProgress", type: "function",
  inputs: [
    { name: "protocolId", type: "uint256" },
    { name: "commitmentHash", type: "bytes32" },
  ],
  outputs: [], stateMutability: "nonpayable",
}] as const;

type Status = "idle" | "pending" | "done" | "error";

function useTx() {
  const [status, setStatus] = useState<Status>("idle");
  const [txHash, setTxHash] = useState<string>();
  const [err, setErr] = useState<string>();
  const { writeContract } = useMiniPayCUSD();

  async function send(params: Parameters<typeof writeContract>[0]) {
    setStatus("pending"); setErr(undefined);
    try {
      const hash = await writeContract(params);
      setTxHash(hash); setStatus("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  return { status, txHash, err, send };
}

function TxStatus({ status, txHash, err }: { status: Status; txHash?: string; err?: string }) {
  if (status === "pending") return <p className="text-xs text-yellow-400 mt-2">⏳ Sending…</p>;
  if (status === "done") return (
    <p className="text-xs text-green-400 mt-2">
      ✓ Done{" "}
      {txHash && <a href={`https://celoscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">View ↗</a>}
    </p>
  );
  if (status === "error") return <p className="text-xs text-red-400 mt-2 break-words">✗ {err}</p>;
  return null;
}

function Btn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-400 hover:to-emerald-300 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl text-sm transition-all mt-3">
      {children}
    </button>
  );
}

// ── ProfileAnchor ─────────────────────────────────────────────────────────────
export function ProfileAnchorCard() {
  const { address } = useAccount();
  const [bio, setBio] = useState("");
  const { status, txHash, err, send } = useTx();

  function handleAnchor() {
    if (!C.ProfileAnchor || !address) return;
    const hash = keccak256(encodePacked(["address", "string", "uint256"], [address, bio, BigInt(Date.now())]));
    send({ address: C.ProfileAnchor, abi: PROFILE_ABI, functionName: "anchorProfile", args: [hash] });
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <p className="text-sm font-semibold text-white mb-1">🪪 Profile Anchor</p>
      <p className="text-xs text-gray-500 mb-3">Commit a hash of your identity on-chain. Raw data stays off-chain.</p>
      <input value={bio} onChange={e => setBio(e.target.value)} placeholder="Profile bio or identifier"
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
      <Btn onClick={handleAnchor} disabled={status === "pending" || !bio}>Anchor Profile</Btn>
      <TxStatus status={status} txHash={txHash} err={err} />
    </div>
  );
}

// ── StreakVerifier ────────────────────────────────────────────────────────────
export function StreakAnchorCard() {
  const { address } = useAccount();
  const [streak, setStreak] = useState("1");
  const { status, txHash, err, send } = useTx();

  function handleAnchor() {
    if (!C.StreakVerifier || !address) return;
    const proofHash = keccak256(encodePacked(["address", "uint32", "uint256"], [address, Number(streak), BigInt(Date.now())]));
    send({ address: C.StreakVerifier, abi: STREAK_ABI, functionName: "anchorStreak", args: [address, proofHash, Number(streak)] });
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <p className="text-sm font-semibold text-white mb-1">🔥 Streak Anchor</p>
      <p className="text-xs text-gray-500 mb-3">Anchor today's habit streak proof on-chain (23h cooldown enforced).</p>
      <input type="number" min="1" value={streak} onChange={e => setStreak(e.target.value)} placeholder="Current streak days"
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
      <Btn onClick={handleAnchor} disabled={status === "pending" || !streak}>Anchor Streak</Btn>
      <TxStatus status={status} txHash={txHash} err={err} />
    </div>
  );
}

// ── IPFSExportRegistry ────────────────────────────────────────────────────────
const EXPORT_TYPES = ["FULL", "LOGS", "INSIGHTS", "ANALYTICS"];

export function IPFSExportCard() {
  const [cid, setCid] = useState("");
  const [exportType, setExportType] = useState(0);
  const { status, txHash, err, send } = useTx();

  function handleAnchor() {
    if (!C.IPFSExportRegistry || !cid) return;
    const contentHash = keccak256(encodePacked(["string"], [cid]));
    send({ address: C.IPFSExportRegistry, abi: EXPORT_ABI, functionName: "anchorExport", args: [cid, contentHash, exportType] });
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <p className="text-sm font-semibold text-white mb-1">📦 IPFS Export</p>
      <p className="text-xs text-gray-500 mb-3">Anchor an encrypted IPFS export CID on-chain for verifiable data portability.</p>
      <input value={cid} onChange={e => setCid(e.target.value)} placeholder="IPFS CID (e.g. Qm...)"
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 mb-2" />
      <select value={exportType} onChange={e => setExportType(Number(e.target.value))}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500">
        {EXPORT_TYPES.map((t, i) => <option key={t} value={i}>{t}</option>)}
      </select>
      <Btn onClick={handleAnchor} disabled={status === "pending" || !cid}>Anchor Export</Btn>
      <TxStatus status={status} txHash={txHash} err={err} />
    </div>
  );
}

// ── GrowthIdentity ────────────────────────────────────────────────────────────
export function GrowthIdentityCard() {
  const { address } = useAccount();
  const [level, setLevel] = useState("1");
  const { status, txHash, err, send } = useTx();

  function handlePublish() {
    if (!C.GrowthIdentity || !address) return;
    const commitment = keccak256(encodePacked(["address", "uint8", "uint256"], [address, Number(level), BigInt(Date.now())]));
    send({ address: C.GrowthIdentity, abi: IDENTITY_ABI, functionName: "publishIdentity", args: [commitment, Number(level)] });
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <p className="text-sm font-semibold text-white mb-1">🌐 Growth Identity</p>
      <p className="text-xs text-gray-500 mb-3">Publish a composable growth identity commitment for cross-app verification.</p>
      <input type="number" min="1" max="100" value={level} onChange={e => setLevel(e.target.value)} placeholder="Growth level (1-100)"
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
      <Btn onClick={handlePublish} disabled={status === "pending" || !level}>Publish Identity</Btn>
      <TxStatus status={status} txHash={txHash} err={err} />
    </div>
  );
}

// ── WellnessProtocol ──────────────────────────────────────────────────────────
export function WellnessProtocolCard() {
  const [protocolId, setProtocolId] = useState("0");
  const [progress, setProgress] = useState("");
  const [mode, setMode] = useState<"optin" | "progress">("optin");
  const { status, txHash, err, send } = useTx();

  function handleOptIn() {
    if (!C.WellnessProtocol) return;
    send({ address: C.WellnessProtocol, abi: WELLNESS_OPT_ABI, functionName: "optIn", args: [BigInt(protocolId)] });
  }

  function handleProgress() {
    if (!C.WellnessProtocol || !progress) return;
    const commitmentHash = keccak256(encodePacked(["string", "uint256"], [progress, BigInt(Date.now())]));
    send({ address: C.WellnessProtocol, abi: WELLNESS_PROGRESS_ABI, functionName: "commitProgress", args: [BigInt(protocolId), commitmentHash] });
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <p className="text-sm font-semibold text-white mb-1">🧘 Wellness Protocol</p>
      <p className="text-xs text-gray-500 mb-3">Opt into a wellness program or commit your progress hash.</p>
      <div className="flex gap-2 mb-3">
        {(["optin", "progress"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${mode === m ? "bg-green-500 text-black" : "bg-gray-700 text-gray-400"}`}>
            {m === "optin" ? "Opt In" : "Commit Progress"}
          </button>
        ))}
      </div>
      <input type="number" min="0" value={protocolId} onChange={e => setProtocolId(e.target.value)} placeholder="Protocol ID"
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 mb-2" />
      {mode === "progress" && (
        <input value={progress} onChange={e => setProgress(e.target.value)} placeholder="Progress note (hashed locally)"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
      )}
      <Btn onClick={mode === "optin" ? handleOptIn : handleProgress} disabled={status === "pending"}>
        {mode === "optin" ? "Opt In" : "Commit Progress"}
      </Btn>
      <TxStatus status={status} txHash={txHash} err={err} />
    </div>
  );
}
