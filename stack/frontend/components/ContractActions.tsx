"use client";

import { useState } from "react";
import {
  openContractCall,
  bufferCVFromString,
  uintCV,
  stringAsciiCV,
  principalCV,
} from "@stacks/connect";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { CONTRACTS, NETWORK, explorerTx } from "@/lib/contracts";
import { APP_DETAILS } from "@/lib/stacks";
import { useStacksAuth } from "@/lib/stacksAuth";
import { useProfileAnchor } from "@/hooks/useProfileAnchor";
import { useStreakVerifier } from "@/hooks/useStreakVerifier";
import { useGrowthIdentity } from "@/hooks/useGrowthIdentity";
import { useIPFSExport } from "@/hooks/useIPFSExport";

type Status = "idle" | "pending" | "done" | "error";

/** Hash a string to a 32-byte buffer using SHA-256 */
function hashToBuffer(input: string): Uint8Array {
  return sha256(new TextEncoder().encode(input));
}

function useTx() {
  const [status, setStatus] = useState<Status>("idle");
  const [txId, setTxId]     = useState<string>();
  const [err, setErr]       = useState<string>();

  function send(contractId: string, functionName: string, functionArgs: unknown[]) {
    const [contractAddress, contractName] = contractId.split(".");
    setStatus("pending"); setErr(undefined);
    openContractCall({
      contractAddress,
      contractName,
      functionName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      functionArgs: functionArgs as any[],
      network: NETWORK,
      appDetails: APP_DETAILS,
      onFinish: ({ txId: id }) => { setTxId(id); setStatus("done"); },
      onCancel: () => setStatus("idle"),
    });
  }

  return { status, txId, err, send };
}

function TxStatus({ status, txId, err }: { status: Status; txId?: string; err?: string }) {
  if (status === "pending") return <p className="text-xs text-yellow-400 mt-2">⏳ Awaiting wallet…</p>;
  if (status === "done") return (
    <p className="text-xs text-green-400 mt-2">
      ✓ Broadcast{" "}
      {txId && <a href={explorerTx(txId)} target="_blank" rel="noopener noreferrer" className="underline">View ↗</a>}
    </p>
  );
  if (status === "error") return <p className="text-xs text-red-400 mt-2 break-words">✗ {err}</p>;
  return null;
}

function Btn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl text-sm transition-all mt-3">
      {children}
    </button>
  );
}

// ── ProfileAnchor ─────────────────────────────────────────────────────────────
export function ProfileAnchorCard() {
  const { stxAddress } = useStacksAuth();
  const [bio, setBio] = useState("");
  const { status, txId, err, send } = useTx();
  const { hasProfile, profileHash } = useProfileAnchor();

  function handleAnchor() {
    if (!stxAddress || !bio) return;
    const hash = hashToBuffer(`${stxAddress}:${bio}:${Date.now()}`);
    send(CONTRACTS.profileAnchor, "anchor-profile", [bufferCVFromString(bytesToHex(hash))]);
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <p className="text-sm font-semibold text-white mb-1">🪪 Profile Anchor</p>
      <p className="text-xs text-gray-500 mb-3">Commit a hash of your identity on-chain. Raw data stays off-chain.</p>
      {hasProfile && (
        <div className="bg-green-950/40 border border-green-800/30 rounded-xl p-3 mb-3">
          <p className="text-xs text-green-400">Profile anchored ✓</p>
          <p className="text-xs font-mono text-gray-500 truncate mt-0.5">{profileHash}</p>
        </div>
      )}
      <input value={bio} onChange={e => setBio(e.target.value)} placeholder="Profile bio or identifier"
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
      <Btn onClick={handleAnchor} disabled={status === "pending" || !bio || !stxAddress}>
        {hasProfile ? "Update Profile" : "Anchor Profile"}
      </Btn>
      <TxStatus status={status} txId={txId} err={err} />
    </div>
  );
}

// ── StreakVerifier ────────────────────────────────────────────────────────────
export function StreakAnchorCard() {
  const { stxAddress } = useStacksAuth();
  const [streak, setStreak] = useState("1");
  const { status, txId, err, send } = useTx();
  const { currentStreak, lastSubmittedAt, streakCount } = useStreakVerifier();

  function handleAnchor() {
    if (!stxAddress || !streak) return;
    const proofHash = hashToBuffer(`${stxAddress}:${streak}:${Date.now()}`);
    send(CONTRACTS.streakVerifier, "anchor-streak", [
      principalCV(stxAddress),
      bufferCVFromString(bytesToHex(proofHash)),
      uintCV(Number(streak)),
    ]);
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <p className="text-sm font-semibold text-white mb-1">🔥 Streak Anchor</p>
      <p className="text-xs text-gray-500 mb-3">Anchor today's habit streak proof on-chain (23h cooldown enforced by oracle).</p>
      {currentStreak > 0 && (
        <div className="bg-orange-950/40 border border-orange-800/30 rounded-xl p-3 mb-3">
          <p className="text-xs text-orange-400">Current on-chain streak: <strong>{currentStreak} days</strong></p>
          {lastSubmittedAt && <p className="text-xs text-gray-500 mt-0.5">Last block: {lastSubmittedAt}</p>}
          <p className="text-xs text-gray-500">Total anchors: {streakCount}</p>
        </div>
      )}
      <input type="number" min="1" value={streak} onChange={e => setStreak(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
      <Btn onClick={handleAnchor} disabled={status === "pending" || !streak || !stxAddress}>Anchor Streak</Btn>
      <TxStatus status={status} txId={txId} err={err} />
    </div>
  );
}

// ── IPFSExportRegistry ────────────────────────────────────────────────────────
const EXPORT_TYPES = ["FULL", "LOGS", "INSIGHTS", "ANALYTICS"];

export function IPFSExportCard() {
  const { stxAddress } = useStacksAuth();
  const [cid, setCid] = useState("");
  const [exportType, setExportType] = useState(0);
  const { status, txId, err, send } = useTx();
  const { latestCID, exportType: lastType, exportedAt, exportCount } = useIPFSExport();

  function handleAnchor() {
    if (!cid) return;
    const contentHash = hashToBuffer(cid);
    send(CONTRACTS.ipfsExportRegistry, "anchor-export", [
      stringAsciiCV(cid),
      bufferCVFromString(bytesToHex(contentHash)),
      uintCV(exportType),
    ]);
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <p className="text-sm font-semibold text-white mb-1">📦 IPFS Export</p>
      <p className="text-xs text-gray-500 mb-3">Anchor an encrypted IPFS export CID on-chain for verifiable data portability.</p>
      {latestCID && (
        <div className="bg-gray-800/60 rounded-xl p-3 mb-3">
          <p className="text-xs text-gray-400">Latest: <span className="text-orange-400">{lastType}</span></p>
          <p className="text-xs font-mono text-gray-500 truncate">{latestCID}</p>
          {exportedAt && <p className="text-xs text-gray-600 mt-0.5">Block {exportedAt} · {exportCount} total</p>}
        </div>
      )}
      <input value={cid} onChange={e => setCid(e.target.value)} placeholder="IPFS CID (e.g. Qm...)"
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2" />
      <select value={exportType} onChange={e => setExportType(Number(e.target.value))}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
        {EXPORT_TYPES.map((t, i) => <option key={t} value={i}>{t}</option>)}
      </select>
      <Btn onClick={handleAnchor} disabled={status === "pending" || !cid || !stxAddress}>Anchor Export</Btn>
      <TxStatus status={status} txId={txId} err={err} />
    </div>
  );
}

// ── GrowthIdentity ────────────────────────────────────────────────────────────
export function GrowthIdentityCard() {
  const { stxAddress } = useStacksAuth();
  const [level, setLevel] = useState("1");
  const { status, txId, err, send } = useTx();
  const { hasIdentity, growthLevel, publishedAt } = useGrowthIdentity();

  function handlePublish() {
    if (!stxAddress || !level) return;
    const commitment = hashToBuffer(`${stxAddress}:${level}:${Date.now()}`);
    send(CONTRACTS.growthIdentity, "publish-identity", [
      bufferCVFromString(bytesToHex(commitment)),
      uintCV(Number(level)),
    ]);
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <p className="text-sm font-semibold text-white mb-1">🌐 Growth Identity</p>
      <p className="text-xs text-gray-500 mb-3">Publish a composable growth identity commitment for cross-app verification.</p>
      {hasIdentity && (
        <div className="bg-blue-950/40 border border-blue-800/30 rounded-xl p-3 mb-3">
          <p className="text-xs text-blue-400">Active identity · Level <strong>{growthLevel}</strong></p>
          {publishedAt && <p className="text-xs text-gray-500 mt-0.5">Block: {publishedAt}</p>}
        </div>
      )}
      <input type="number" min="1" max="100" value={level} onChange={e => setLevel(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
      <Btn onClick={handlePublish} disabled={status === "pending" || !level || !stxAddress}>
        {hasIdentity ? "Update Identity" : "Publish Identity"}
      </Btn>
      <TxStatus status={status} txId={txId} err={err} />
    </div>
  );
}

// ── WellnessProtocol ──────────────────────────────────────────────────────────
export function WellnessProtocolCard() {
  const { stxAddress } = useStacksAuth();
  const [protocolId, setProtocolId] = useState("0");
  const [progressNote, setProgressNote] = useState("");
  const [mode, setMode] = useState<"optin" | "progress">("optin");
  const { status, txId, err, send } = useTx();

  function handleOptIn() {
    send(CONTRACTS.wellnessProtocol, "opt-in", [uintCV(Number(protocolId))]);
  }

  function handleProgress() {
    if (!progressNote) return;
    const commitmentHash = hashToBuffer(`${progressNote}:${Date.now()}`);
    send(CONTRACTS.wellnessProtocol, "commit-progress", [
      uintCV(Number(protocolId)),
      bufferCVFromString(bytesToHex(commitmentHash)),
    ]);
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <p className="text-sm font-semibold text-white mb-1">🧘 Wellness Protocol</p>
      <p className="text-xs text-gray-500 mb-3">Opt into a wellness program or commit your progress hash.</p>
      <div className="flex gap-2 mb-3">
        {(["optin", "progress"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${mode === m ? "bg-orange-500 text-black" : "bg-gray-700 text-gray-400"}`}>
            {m === "optin" ? "Opt In" : "Commit Progress"}
          </button>
        ))}
      </div>
      <input type="number" min="0" value={protocolId} onChange={e => setProtocolId(e.target.value)} placeholder="Protocol ID"
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2" />
      {mode === "progress" && (
        <input value={progressNote} onChange={e => setProgressNote(e.target.value)} placeholder="Progress note (hashed locally)"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
      )}
      <Btn onClick={mode === "optin" ? handleOptIn : handleProgress}
        disabled={status === "pending" || !stxAddress || (mode === "progress" && !progressNote)}>
        {mode === "optin" ? "Opt In" : "Commit Progress"}
      </Btn>
      <TxStatus status={status} txId={txId} err={err} />
    </div>
  );
}
