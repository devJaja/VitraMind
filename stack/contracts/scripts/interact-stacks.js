/**
 * VitraMind — Stacks Mainnet Interaction Script
 * Exercises all 7 deployed Clarity contracts via read-only and public calls.
 *
 * Usage: node scripts/interact-stacks.js
 * Requires: STACKS_PRIVATE_KEY in .env
 */

require("dotenv").config();
const {
  makeContractCall,
  callReadOnlyFunction,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  bufferCV,
  uintCV,
  stringAsciiCV,
  principalCV,
  cvToValue,
} = require("@stacks/transactions");
const { StacksMainnet } = require("@stacks/network");
const { createHash } = require("crypto");

const network    = new StacksMainnet();
const senderKey  = process.env.STACKS_PRIVATE_KEY;
const DEPLOYER   = process.env.STACKS_DEPLOYER_ADDRESS;

if (!senderKey || !DEPLOYER) {
  throw new Error("Set STACKS_PRIVATE_KEY and STACKS_DEPLOYER_ADDRESS in .env");
}

const CONTRACTS = {
  profileAnchor:      `${DEPLOYER}.profile-anchor`,
  proofRegistry:      `${DEPLOYER}.proof-registry`,
  streakVerifier:     `${DEPLOYER}.streak-verifier`,
  analyticsRegistry:  `${DEPLOYER}.analytics-registry`,
  ipfsExportRegistry: `${DEPLOYER}.ipfs-export-registry`,
  growthIdentity:     `${DEPLOYER}.growth-identity`,
  wellnessProtocol:   `${DEPLOYER}.wellness-protocol`,
};

function hash32(input) {
  return Buffer.from(createHash("sha256").update(input).digest());
}

function split(contractId) {
  const [addr, name] = contractId.split(".");
  return { contractAddress: addr, contractName: name };
}

async function read(contractId, fn, args, sender) {
  const { contractAddress, contractName } = split(contractId);
  const result = await callReadOnlyFunction({
    contractAddress, contractName,
    functionName: fn,
    functionArgs: args,
    network,
    senderAddress: sender ?? DEPLOYER,
  });
  return cvToValue(result);
}

async function write(contractId, fn, args) {
  const { contractAddress, contractName } = split(contractId);
  const tx = await makeContractCall({
    contractAddress, contractName,
    functionName: fn,
    functionArgs: args,
    senderKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  });
  const res = await broadcastTransaction(tx, network);
  if (res.error) throw new Error(`${fn}: ${res.error} — ${res.reason}`);
  return res.txid;
}

const log = (n, msg) => console.log(`\n[${String(n).padStart(2,"0")}] ${msg}`);

async function main() {
  console.log("═".repeat(60));
  console.log(" VitraMind — Stacks Mainnet Interactions");
  console.log(`  Deployer : ${DEPLOYER}`);
  console.log("═".repeat(60));

  // ── READS ──────────────────────────────────────────────────────────────────

  log(1, "ProfileAnchor: has-profile?");
  console.log("  ", await read(CONTRACTS.profileAnchor, "has-profile", [principalCV(DEPLOYER)]));

  log(2, "ProofRegistry: get-proof-count");
  console.log("  ", await read(CONTRACTS.proofRegistry, "get-proof-count", [principalCV(DEPLOYER)]));

  log(3, "StreakVerifier: get-streak-count");
  console.log("  ", await read(CONTRACTS.streakVerifier, "get-streak-count", [principalCV(DEPLOYER)]));

  log(4, "AnalyticsRegistry: get-snapshot-count");
  console.log("  ", await read(CONTRACTS.analyticsRegistry, "get-snapshot-count", [principalCV(DEPLOYER)]));

  log(5, "IPFSExportRegistry: get-export-count");
  console.log("  ", await read(CONTRACTS.ipfsExportRegistry, "get-export-count", [principalCV(DEPLOYER)]));

  log(6, "GrowthIdentity: has-active-identity?");
  console.log("  ", await read(CONTRACTS.growthIdentity, "has-active-identity", [principalCV(DEPLOYER)]));

  log(7, "WellnessProtocol: get-protocol-count");
  console.log("  ", await read(CONTRACTS.wellnessProtocol, "get-protocol-count", []));

  // ── WRITES ─────────────────────────────────────────────────────────────────

  log(8, "ProfileAnchor: anchor-profile");
  const ph = hash32(`profile-${DEPLOYER}-${Date.now()}`);
  console.log("  txid:", await write(CONTRACTS.profileAnchor, "anchor-profile", [bufferCV(ph)]));

  log(9, "ProofRegistry: submit-proof (LOG)");
  const lh = hash32(`log-${Date.now()}`);
  console.log("  txid:", await write(CONTRACTS.proofRegistry, "submit-proof", [bufferCV(lh), uintCV(0)]));

  log(10, "ProofRegistry: submit-proof (INSIGHT)");
  const ih = hash32(`insight-${Date.now()}`);
  console.log("  txid:", await write(CONTRACTS.proofRegistry, "submit-proof", [bufferCV(ih), uintCV(1)]));

  log(11, "ProofRegistry: submit-proof (STREAK)");
  const sh = hash32(`streak-${Date.now()}`);
  console.log("  txid:", await write(CONTRACTS.proofRegistry, "submit-proof", [bufferCV(sh), uintCV(2)]));

  log(12, "ProofRegistry: submit-proof (ACHIEVEMENT)");
  const ah = hash32(`achievement-${Date.now()}`);
  console.log("  txid:", await write(CONTRACTS.proofRegistry, "submit-proof", [bufferCV(ah), uintCV(3)]));

  log(13, "WellnessProtocol: register-protocol");
  console.log("  txid:", await write(CONTRACTS.wellnessProtocol, "register-protocol", [
    stringAsciiCV(`Stacks-Wellness-${Date.now()}`),
    stringAsciiCV("QmStacksWellnessSchemaCID"),
  ]));

  log(14, "GrowthIdentity: publish-identity (level 20)");
  const ic = hash32(`identity-${DEPLOYER}-${Date.now()}`);
  console.log("  txid:", await write(CONTRACTS.growthIdentity, "publish-identity", [bufferCV(ic), uintCV(20)]));

  log(15, "IPFSExportRegistry: anchor-export (FULL)");
  const ech = hash32(`export-${Date.now()}`);
  console.log("  txid:", await write(CONTRACTS.ipfsExportRegistry, "anchor-export", [
    stringAsciiCV("QmVitraMindStacksExport1"),
    bufferCV(ech),
    uintCV(0),
  ]));

  console.log("\n" + "═".repeat(60));
  console.log(" All 15 Stacks mainnet interactions completed ✓");
  console.log("═".repeat(60));
}

main().catch(e => { console.error(e); process.exitCode = 1; });
