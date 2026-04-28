/**
 * VitraMind — Stacks Mainnet Interaction Script
 * Exercises all 7 deployed Clarity contracts via read-only and public calls.
 *
 * Usage:
 *   node scripts/interact-stacks.js
 *
 * Requires in .env:
 *   STACKS_PRIVATE_KEY        — deployer private key (hex, no 0x prefix)
 *   STACKS_DEPLOYER_ADDRESS   — deployer STX mainnet address (SP...)
 *                               OR leave blank to auto-derive from key
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

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
  getAddressFromPrivateKey,
  TransactionVersion,
} = require("@stacks/transactions");
const { StacksMainnet } = require("@stacks/network");
const { createHash } = require("crypto");

const network   = new StacksMainnet();
const senderKey = process.env.STACKS_PRIVATE_KEY;
if (!senderKey) throw new Error("STACKS_PRIVATE_KEY not set in contracts/.env");

// Derive mainnet address from private key if not explicitly set
const DEPLOYER = process.env.STACKS_DEPLOYER_ADDRESS
  || getAddressFromPrivateKey(senderKey, TransactionVersion.Mainnet);

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
  const [contractAddress, contractName] = contractId.split(".");
  return { contractAddress, contractName };
}

async function read(contractId, fn, args) {
  const { contractAddress, contractName } = split(contractId);
  const result = await callReadOnlyFunction({
    contractAddress, contractName,
    functionName: fn,
    functionArgs: args,
    network,
    senderAddress: DEPLOYER,
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
    fee: 2000n,
  });
  const res = await broadcastTransaction({ transaction: tx, network });
  if (res.error) throw new Error(`${fn}: ${res.error} — ${res.reason ?? ""}`);
  return res.txid;
}

const log = (n, msg) => console.log(`\n[${String(n).padStart(2, "0")}] ${msg}`);

async function main() {
  console.log("═".repeat(60));
  console.log(" VitraMind — Stacks Mainnet Interactions");
  console.log(`  Signer/Deployer : ${DEPLOYER}`);
  console.log("═".repeat(60));

  // ── READS ──────────────────────────────────────────────────────────────────

  log(1, "ProfileAnchor: has-profile?");
  console.log("  ", await read(CONTRACTS.profileAnchor, "has-profile", [principalCV(DEPLOYER)]));

  log(2, "ProfileAnchor: get-profile-hash");
  console.log("  ", await read(CONTRACTS.profileAnchor, "get-profile-hash", [principalCV(DEPLOYER)]));

  log(3, "ProofRegistry: get-proof-count");
  const pc0 = await read(CONTRACTS.proofRegistry, "get-proof-count", [principalCV(DEPLOYER)]);
  console.log("   proofCount:", pc0);

  log(4, "StreakVerifier: get-streak-count");
  console.log("  ", await read(CONTRACTS.streakVerifier, "get-streak-count", [principalCV(DEPLOYER)]));

  log(5, "StreakVerifier: latest-streak");
  console.log("  ", await read(CONTRACTS.streakVerifier, "latest-streak", [principalCV(DEPLOYER)]));

  log(6, "AnalyticsRegistry: get-snapshot-count");
  console.log("  ", await read(CONTRACTS.analyticsRegistry, "get-snapshot-count", [principalCV(DEPLOYER)]));

  log(7, "IPFSExportRegistry: get-export-count");
  const ec0 = await read(CONTRACTS.ipfsExportRegistry, "get-export-count", [principalCV(DEPLOYER)]);
  console.log("   exportCount:", ec0);

  log(8, "GrowthIdentity: has-active-identity?");
  console.log("  ", await read(CONTRACTS.growthIdentity, "has-active-identity", [principalCV(DEPLOYER)]));

  log(9, "GrowthIdentity: get-identity");
  console.log("  ", await read(CONTRACTS.growthIdentity, "get-identity", [principalCV(DEPLOYER)]));

  log(10, "WellnessProtocol: get-protocol-count");
  const wCount = await read(CONTRACTS.wellnessProtocol, "get-protocol-count", []);
  console.log("   protocolCount:", wCount);

  // ── WRITES ─────────────────────────────────────────────────────────────────

  log(11, "ProfileAnchor: anchor-profile — write");
  const ph = hash32(`profile-${DEPLOYER}-${Date.now()}`);
  const t11 = await write(CONTRACTS.profileAnchor, "anchor-profile", [bufferCV(ph)]);
  console.log("   txid:", t11);

  log(12, "ProfileAnchor: has-profile? — verify");
  console.log("  ", await read(CONTRACTS.profileAnchor, "has-profile", [principalCV(DEPLOYER)]));

  log(13, "ProofRegistry: submit-proof (LOG=0)");
  const lh = hash32(`log-${DEPLOYER}-${Date.now()}`);
  console.log("   txid:", await write(CONTRACTS.proofRegistry, "submit-proof", [bufferCV(lh), uintCV(0)]));

  log(14, "ProofRegistry: submit-proof (INSIGHT=1)");
  const ih = hash32(`insight-${DEPLOYER}-${Date.now()}`);
  console.log("   txid:", await write(CONTRACTS.proofRegistry, "submit-proof", [bufferCV(ih), uintCV(1)]));

  log(15, "ProofRegistry: submit-proof (STREAK=2)");
  const sh = hash32(`streak-${DEPLOYER}-${Date.now()}`);
  console.log("   txid:", await write(CONTRACTS.proofRegistry, "submit-proof", [bufferCV(sh), uintCV(2)]));

  log(16, "ProofRegistry: submit-proof (ACHIEVEMENT=3)");
  const ah = hash32(`achievement-${DEPLOYER}-${Date.now()}`);
  console.log("   txid:", await write(CONTRACTS.proofRegistry, "submit-proof", [bufferCV(ah), uintCV(3)]));

  log(17, "ProofRegistry: get-proof-count — after writes");
  console.log("   proofCount:", await read(CONTRACTS.proofRegistry, "get-proof-count", [principalCV(DEPLOYER)]));

  log(18, "WellnessProtocol: register-protocol");
  const t18 = await write(CONTRACTS.wellnessProtocol, "register-protocol", [
    stringAsciiCV(`Stacks-Wellness-${Date.now()}`),
    stringAsciiCV("QmStacksWellnessSchemaCID"),
  ]);
  console.log("   txid:", t18);

  log(19, "WellnessProtocol: opt-in (protocolId = wCount)");
  const t19 = await write(CONTRACTS.wellnessProtocol, "opt-in", [uintCV(Number(wCount))]);
  console.log("   txid:", t19);

  log(20, "WellnessProtocol: commit-progress");
  const cp = hash32(`progress-${DEPLOYER}-${Date.now()}`);
  const t20 = await write(CONTRACTS.wellnessProtocol, "commit-progress", [
    uintCV(Number(wCount)),
    bufferCV(cp),
  ]);
  console.log("   txid:", t20);

  log(21, "WellnessProtocol: opt-out");
  const t21 = await write(CONTRACTS.wellnessProtocol, "opt-out", [uintCV(Number(wCount))]);
  console.log("   txid:", t21);

  log(22, "GrowthIdentity: publish-identity (level 20)");
  const ic = hash32(`identity-${DEPLOYER}-${Date.now()}`);
  const t22 = await write(CONTRACTS.growthIdentity, "publish-identity", [bufferCV(ic), uintCV(20)]);
  console.log("   txid:", t22);

  log(23, "GrowthIdentity: has-active-identity? — verify");
  console.log("  ", await read(CONTRACTS.growthIdentity, "has-active-identity", [principalCV(DEPLOYER)]));

  log(24, "IPFSExportRegistry: anchor-export (FULL=0)");
  const ech1 = hash32(`export-full-${DEPLOYER}-${Date.now()}`);
  const t24 = await write(CONTRACTS.ipfsExportRegistry, "anchor-export", [
    stringAsciiCV("QmVitraMindStacksFullExport1"),
    bufferCV(ech1),
    uintCV(0),
  ]);
  console.log("   txid:", t24);

  log(25, "IPFSExportRegistry: anchor-export (ANALYTICS=3)");
  const ech2 = hash32(`export-analytics-${DEPLOYER}-${Date.now()}`);
  const t25 = await write(CONTRACTS.ipfsExportRegistry, "anchor-export", [
    stringAsciiCV("QmVitraMindStacksAnalyticsExport1"),
    bufferCV(ech2),
    uintCV(3),
  ]);
  console.log("   txid:", t25);

  log(26, "IPFSExportRegistry: get-export-count — final");
  console.log("   exportCount:", await read(CONTRACTS.ipfsExportRegistry, "get-export-count", [principalCV(DEPLOYER)]));

  log(27, "IPFSExportRegistry: latest-export");
  console.log("  ", await read(CONTRACTS.ipfsExportRegistry, "latest-export", [principalCV(DEPLOYER)]));

  console.log("\n" + "═".repeat(60));
  console.log(" All 27 Stacks mainnet interactions completed ✓");
  console.log(` Explorer: https://explorer.hiro.so/?chain=mainnet`);
  console.log("═".repeat(60));
}

main().catch(e => { console.error(e); process.exitCode = 1; });
