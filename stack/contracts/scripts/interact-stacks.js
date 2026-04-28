/**
 * VitraMind — Stacks Bitcoin Mainnet Interaction Script
 * 110+ interactions across all 7 deployed Clarity contracts.
 *
 * Usage:  node scripts/interact-stacks.js
 * Needs:  STACKS_PRIVATE_KEY in contracts/.env  (hex, no 0x prefix)
 *         STACKS_DEPLOYER_ADDRESS (optional — auto-derived from key)
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
const { createHash }    = require("crypto");

const network   = new StacksMainnet();
const senderKey = process.env.STACKS_PRIVATE_KEY;
if (!senderKey) throw new Error("STACKS_PRIVATE_KEY not set in contracts/.env");

const DEPLOYER = process.env.STACKS_DEPLOYER_ADDRESS
  || getAddressFromPrivateKey(senderKey, TransactionVersion.Mainnet);

const C = {
  pa:  `${DEPLOYER}.profile-anchor`,
  pr:  `${DEPLOYER}.proof-registry`,
  sv:  `${DEPLOYER}.streak-verifier`,
  ar:  `${DEPLOYER}.analytics-registry`,
  ie:  `${DEPLOYER}.ipfs-export-registry`,
  gi:  `${DEPLOYER}.growth-identity`,
  wp:  `${DEPLOYER}.wellness-protocol`,
};

function h32(s) { return Buffer.from(createHash("sha256").update(s).digest()); }
function sp(id) { const [a, n] = id.split("."); return { contractAddress: a, contractName: n }; }

async function r(contractId, fn, args) {
  const cv = await callReadOnlyFunction({
    ...sp(contractId), functionName: fn, functionArgs: args,
    network, senderAddress: DEPLOYER,
  });
  return cvToValue(cv);
}

async function w(contractId, fn, args) {
  const tx = await makeContractCall({
    ...sp(contractId), functionName: fn, functionArgs: args,
    senderKey, network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 2000n,
  });
  const res = await broadcastTransaction({ transaction: tx, network });
  if (res.error) throw new Error(`${fn}: ${res.error} — ${res.reason ?? ""}`);
  return res.txid;
}

let n = 0;
const log = (label) => console.log(`\n[${String(++n).padStart(3, "0")}] ${label}`);
const ok  = (v)     => console.log("   →", JSON.stringify(v));

async function main() {
  console.log("═".repeat(64));
  console.log(" VitraMind — Stacks Bitcoin Mainnet  (110+ interactions)");
  console.log(`  Signer : ${DEPLOYER}`);
  console.log("═".repeat(64));

  const dp = principalCV(DEPLOYER);

  // ══════════════════════════════════════════════════════════════
  // SECTION 1 — ProfileAnchor  (reads: 4, writes: 4)
  // ══════════════════════════════════════════════════════════════
  log("ProfileAnchor · has-profile (initial)");
  ok(await r(C.pa, "has-profile", [dp]));

  log("ProfileAnchor · get-profile-hash (initial)");
  ok(await r(C.pa, "get-profile-hash", [dp]));

  log("ProfileAnchor · get-updated-at (initial)");
  ok(await r(C.pa, "get-updated-at", [dp]));

  log("ProfileAnchor · anchor-profile #1");
  const ph1 = h32(`profile-v1-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pa, "anchor-profile", [bufferCV(ph1)]));

  log("ProfileAnchor · has-profile (after #1)");
  ok(await r(C.pa, "has-profile", [dp]));

  log("ProfileAnchor · get-profile-hash (after #1)");
  ok(await r(C.pa, "get-profile-hash", [dp]));

  log("ProfileAnchor · anchor-profile #2 (update)");
  const ph2 = h32(`profile-v2-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pa, "anchor-profile", [bufferCV(ph2)]));

  log("ProfileAnchor · get-updated-at (after #2)");
  ok(await r(C.pa, "get-updated-at", [dp]));

  // ══════════════════════════════════════════════════════════════
  // SECTION 2 — ProofRegistry  (reads: 10, writes: 12)
  // ══════════════════════════════════════════════════════════════
  log("ProofRegistry · get-proof-count (initial)");
  const pc0 = await r(C.pr, "get-proof-count", [dp]);
  ok(pc0);

  log("ProofRegistry · submit-proof LOG #1");
  const lh1 = h32(`log-1-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(lh1), uintCV(0)]));

  log("ProofRegistry · submit-proof LOG #2");
  const lh2 = h32(`log-2-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(lh2), uintCV(0)]));

  log("ProofRegistry · submit-proof LOG #3");
  const lh3 = h32(`log-3-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(lh3), uintCV(0)]));

  log("ProofRegistry · submit-proof INSIGHT #1");
  const ih1 = h32(`insight-1-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(ih1), uintCV(1)]));

  log("ProofRegistry · submit-proof INSIGHT #2");
  const ih2 = h32(`insight-2-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(ih2), uintCV(1)]));

  log("ProofRegistry · submit-proof STREAK #1");
  const sh1 = h32(`streak-1-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(sh1), uintCV(2)]));

  log("ProofRegistry · submit-proof STREAK #2");
  const sh2 = h32(`streak-2-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(sh2), uintCV(2)]));

  log("ProofRegistry · submit-proof ACHIEVEMENT #1");
  const ah1 = h32(`achievement-1-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(ah1), uintCV(3)]));

  log("ProofRegistry · submit-proof ACHIEVEMENT #2");
  const ah2 = h32(`achievement-2-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(ah2), uintCV(3)]));

  log("ProofRegistry · submit-proof ACHIEVEMENT #3");
  const ah3 = h32(`achievement-3-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(ah3), uintCV(3)]));

  log("ProofRegistry · submit-proof LOG #4");
  const lh4 = h32(`log-4-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(lh4), uintCV(0)]));

  log("ProofRegistry · submit-proof INSIGHT #3");
  const ih3 = h32(`insight-3-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.pr, "submit-proof", [bufferCV(ih3), uintCV(1)]));

  log("ProofRegistry · get-proof-count (after writes)");
  const pc1 = await r(C.pr, "get-proof-count", [dp]);
  ok(pc1);

  log("ProofRegistry · verify-proof lh1");
  ok(await r(C.pr, "verify-proof", [dp, bufferCV(lh1)]));

  log("ProofRegistry · verify-proof ih1");
  ok(await r(C.pr, "verify-proof", [dp, bufferCV(ih1)]));

  log("ProofRegistry · verify-proof sh1");
  ok(await r(C.pr, "verify-proof", [dp, bufferCV(sh1)]));

  log("ProofRegistry · verify-proof ah1");
  ok(await r(C.pr, "verify-proof", [dp, bufferCV(ah1)]));

  log("ProofRegistry · get-proof index 0");
  ok(await r(C.pr, "get-proof", [dp, uintCV(0)]));

  log("ProofRegistry · get-proof index 1");
  ok(await r(C.pr, "get-proof", [dp, uintCV(1)]));

  log("ProofRegistry · get-proof latest (pc1-1)");
  ok(await r(C.pr, "get-proof", [dp, uintCV(Number(pc1) - 1)]));

  // ══════════════════════════════════════════════════════════════
  // SECTION 3 — WellnessProtocol  (reads: 8, writes: 12)
  // ══════════════════════════════════════════════════════════════
  log("WellnessProtocol · get-protocol-count (initial)");
  const wc0 = await r(C.wp, "get-protocol-count", []);
  ok(wc0);

  log("WellnessProtocol · register-protocol #1");
  ok(await w(C.wp, "register-protocol", [
    stringAsciiCV(`Mindfulness-${Date.now()}`),
    stringAsciiCV("QmMindfulnessSchemaCID"),
  ]));
  const pid1 = Number(wc0);

  log("WellnessProtocol · register-protocol #2");
  ok(await w(C.wp, "register-protocol", [
    stringAsciiCV(`SleepHygiene-${Date.now()}`),
    stringAsciiCV("QmSleepHygieneSchemaCID"),
  ]));
  const pid2 = pid1 + 1;

  log("WellnessProtocol · register-protocol #3");
  ok(await w(C.wp, "register-protocol", [
    stringAsciiCV(`GratitudeJournal-${Date.now()}`),
    stringAsciiCV("QmGratitudeSchemaCID"),
  ]));
  const pid3 = pid2 + 1;

  log("WellnessProtocol · get-protocol pid1");
  ok(await r(C.wp, "get-protocol", [uintCV(pid1)]));

  log("WellnessProtocol · get-protocol pid2");
  ok(await r(C.wp, "get-protocol", [uintCV(pid2)]));

  log("WellnessProtocol · get-protocol-count (after 3 registrations)");
  ok(await r(C.wp, "get-protocol-count", []));

  log("WellnessProtocol · opt-in pid1");
  ok(await w(C.wp, "opt-in", [uintCV(pid1)]));

  log("WellnessProtocol · opt-in pid2");
  ok(await w(C.wp, "opt-in", [uintCV(pid2)]));

  log("WellnessProtocol · opt-in pid3");
  ok(await w(C.wp, "opt-in", [uintCV(pid3)]));

  log("WellnessProtocol · is-opted-in pid1");
  ok(await r(C.wp, "is-opted-in", [uintCV(pid1), dp]));

  log("WellnessProtocol · is-opted-in pid2");
  ok(await r(C.wp, "is-opted-in", [uintCV(pid2), dp]));

  log("WellnessProtocol · commit-progress pid1 #1");
  const cp1 = h32(`progress-pid1-1-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.wp, "commit-progress", [uintCV(pid1), bufferCV(cp1)]));

  log("WellnessProtocol · commit-progress pid1 #2");
  const cp2 = h32(`progress-pid1-2-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.wp, "commit-progress", [uintCV(pid1), bufferCV(cp2)]));

  log("WellnessProtocol · commit-progress pid2");
  const cp3 = h32(`progress-pid2-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.wp, "commit-progress", [uintCV(pid2), bufferCV(cp3)]));

  log("WellnessProtocol · get-progress pid1");
  ok(await r(C.wp, "get-progress", [uintCV(pid1), dp]));

  log("WellnessProtocol · get-progress pid2");
  ok(await r(C.wp, "get-progress", [uintCV(pid2), dp]));

  log("WellnessProtocol · opt-out pid3");
  ok(await w(C.wp, "opt-out", [uintCV(pid3)]));

  log("WellnessProtocol · is-opted-in pid3 (after opt-out)");
  ok(await r(C.wp, "is-opted-in", [uintCV(pid3), dp]));

  log("WellnessProtocol · deactivate-protocol pid3");
  ok(await w(C.wp, "deactivate-protocol", [uintCV(pid3)]));

  log("WellnessProtocol · get-protocol pid3 (after deactivate)");
  ok(await r(C.wp, "get-protocol", [uintCV(pid3)]));

  // ══════════════════════════════════════════════════════════════
  // SECTION 4 — GrowthIdentity  (reads: 6, writes: 6)
  // ══════════════════════════════════════════════════════════════
  log("GrowthIdentity · has-active-identity (initial)");
  ok(await r(C.gi, "has-active-identity", [dp]));

  log("GrowthIdentity · get-identity (initial)");
  ok(await r(C.gi, "get-identity", [dp]));

  log("GrowthIdentity · get-app-count (initial)");
  ok(await r(C.gi, "get-app-count", []));

  log("GrowthIdentity · publish-identity level 10");
  const ic1 = h32(`identity-l10-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.gi, "publish-identity", [bufferCV(ic1), uintCV(10)]));

  log("GrowthIdentity · has-active-identity (after publish)");
  ok(await r(C.gi, "has-active-identity", [dp]));

  log("GrowthIdentity · get-identity (level 10)");
  ok(await r(C.gi, "get-identity", [dp]));

  log("GrowthIdentity · publish-identity level 25 (update)");
  const ic2 = h32(`identity-l25-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.gi, "publish-identity", [bufferCV(ic2), uintCV(25)]));

  log("GrowthIdentity · get-identity (level 25)");
  ok(await r(C.gi, "get-identity", [dp]));

  log("GrowthIdentity · publish-identity level 50 (update)");
  const ic3 = h32(`identity-l50-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.gi, "publish-identity", [bufferCV(ic3), uintCV(50)]));

  log("GrowthIdentity · get-identity (level 50)");
  ok(await r(C.gi, "get-identity", [dp]));

  log("GrowthIdentity · deactivate-identity");
  ok(await w(C.gi, "deactivate-identity", []));

  log("GrowthIdentity · has-active-identity (after deactivate)");
  ok(await r(C.gi, "has-active-identity", [dp]));

  log("GrowthIdentity · publish-identity level 50 (reactivate)");
  const ic4 = h32(`identity-l50-reactivate-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.gi, "publish-identity", [bufferCV(ic4), uintCV(50)]));

  log("GrowthIdentity · has-active-identity (reactivated)");
  ok(await r(C.gi, "has-active-identity", [dp]));

  // ══════════════════════════════════════════════════════════════
  // SECTION 5 — IPFSExportRegistry  (reads: 8, writes: 8)
  // ══════════════════════════════════════════════════════════════
  log("IPFSExportRegistry · get-export-count (initial)");
  const ec0 = await r(C.ie, "get-export-count", [dp]);
  ok(ec0);

  log("IPFSExportRegistry · anchor-export FULL #1");
  const ech1 = h32(`export-full-1-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.ie, "anchor-export", [stringAsciiCV("QmVitraMindFullExport1"), bufferCV(ech1), uintCV(0)]));

  log("IPFSExportRegistry · anchor-export LOGS #1");
  const ech2 = h32(`export-logs-1-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.ie, "anchor-export", [stringAsciiCV("QmVitraMindLogsExport1"), bufferCV(ech2), uintCV(1)]));

  log("IPFSExportRegistry · anchor-export INSIGHTS #1");
  const ech3 = h32(`export-insights-1-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.ie, "anchor-export", [stringAsciiCV("QmVitraMindInsightsExport1"), bufferCV(ech3), uintCV(2)]));

  log("IPFSExportRegistry · anchor-export ANALYTICS #1");
  const ech4 = h32(`export-analytics-1-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.ie, "anchor-export", [stringAsciiCV("QmVitraMindAnalyticsExport1"), bufferCV(ech4), uintCV(3)]));

  log("IPFSExportRegistry · anchor-export FULL #2");
  const ech5 = h32(`export-full-2-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.ie, "anchor-export", [stringAsciiCV("QmVitraMindFullExport2"), bufferCV(ech5), uintCV(0)]));

  log("IPFSExportRegistry · anchor-export ANALYTICS #2");
  const ech6 = h32(`export-analytics-2-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.ie, "anchor-export", [stringAsciiCV("QmVitraMindAnalyticsExport2"), bufferCV(ech6), uintCV(3)]));

  log("IPFSExportRegistry · anchor-export LOGS #2");
  const ech7 = h32(`export-logs-2-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.ie, "anchor-export", [stringAsciiCV("QmVitraMindLogsExport2"), bufferCV(ech7), uintCV(1)]));

  log("IPFSExportRegistry · anchor-export INSIGHTS #2");
  const ech8 = h32(`export-insights-2-${DEPLOYER}-${Date.now()}`);
  ok(await w(C.ie, "anchor-export", [stringAsciiCV("QmVitraMindInsightsExport2"), bufferCV(ech8), uintCV(2)]));

  log("IPFSExportRegistry · get-export-count (after 8 exports)");
  ok(await r(C.ie, "get-export-count", [dp]));

  log("IPFSExportRegistry · latest-export");
  ok(await r(C.ie, "latest-export", [dp]));

  log("IPFSExportRegistry · get-export index 0");
  ok(await r(C.ie, "get-export", [dp, uintCV(0)]));

  log("IPFSExportRegistry · get-export index 1");
  ok(await r(C.ie, "get-export", [dp, uintCV(1)]));

  log("IPFSExportRegistry · verify-export ech1");
  ok(await r(C.ie, "verify-export", [dp, bufferCV(ech1)]));

  log("IPFSExportRegistry · verify-export ech4 (ANALYTICS)");
  ok(await r(C.ie, "verify-export", [dp, bufferCV(ech4)]));

  log("IPFSExportRegistry · verify-export ech8 (INSIGHTS #2)");
  ok(await r(C.ie, "verify-export", [dp, bufferCV(ech8)]));

  // ══════════════════════════════════════════════════════════════
  // SECTION 6 — StreakVerifier  (reads: 5, writes: 0 — oracle-only writes)
  // ══════════════════════════════════════════════════════════════
  log("StreakVerifier · get-streak-count");
  ok(await r(C.sv, "get-streak-count", [dp]));

  log("StreakVerifier · get-last-streak-at");
  ok(await r(C.sv, "get-last-streak-at", [dp]));

  log("StreakVerifier · get-oracle");
  ok(await r(C.sv, "get-oracle", []));

  log("StreakVerifier · get-streak index 0 (may be none)");
  ok(await r(C.sv, "get-streak", [dp, uintCV(0)]));

  log("StreakVerifier · latest-streak (may be err if no streaks)");
  try { ok(await r(C.sv, "latest-streak", [dp])); } catch { ok("(no streaks yet)"); }

  // ══════════════════════════════════════════════════════════════
  // SECTION 7 — AnalyticsRegistry  (reads: 4, writes: 0 — oracle-only writes)
  // ══════════════════════════════════════════════════════════════
  log("AnalyticsRegistry · get-snapshot-count");
  ok(await r(C.ar, "get-snapshot-count", [dp]));

  log("AnalyticsRegistry · get-oracle");
  ok(await r(C.ar, "get-oracle", []));

  log("AnalyticsRegistry · get-snapshot index 0 (may be none)");
  ok(await r(C.ar, "get-snapshot", [dp, uintCV(0)]));

  log("AnalyticsRegistry · latest-snapshot weekly (may be err)");
  try { ok(await r(C.ar, "latest-snapshot", [dp, uintCV(0)])); } catch { ok("(no snapshots yet)"); }

  // ══════════════════════════════════════════════════════════════
  // SECTION 8 — Cross-contract reads (final state verification)
  // ══════════════════════════════════════════════════════════════
  log("FINAL · ProfileAnchor · has-profile");
  ok(await r(C.pa, "has-profile", [dp]));

  log("FINAL · ProofRegistry · get-proof-count");
  ok(await r(C.pr, "get-proof-count", [dp]));

  log("FINAL · WellnessProtocol · get-protocol-count");
  ok(await r(C.wp, "get-protocol-count", []));

  log("FINAL · GrowthIdentity · has-active-identity");
  ok(await r(C.gi, "has-active-identity", [dp]));

  log("FINAL · GrowthIdentity · get-identity");
  ok(await r(C.gi, "get-identity", [dp]));

  log("FINAL · IPFSExportRegistry · get-export-count");
  ok(await r(C.ie, "get-export-count", [dp]));

  log("FINAL · IPFSExportRegistry · latest-export");
  ok(await r(C.ie, "latest-export", [dp]));

  log("FINAL · StreakVerifier · get-streak-count");
  ok(await r(C.sv, "get-streak-count", [dp]));

  log("FINAL · AnalyticsRegistry · get-snapshot-count");
  ok(await r(C.ar, "get-snapshot-count", [dp]));

  log("FINAL · WellnessProtocol · is-opted-in pid1");
  ok(await r(C.wp, "is-opted-in", [uintCV(pid1), dp]));

  log("FINAL · WellnessProtocol · get-progress pid1");
  ok(await r(C.wp, "get-progress", [uintCV(pid1), dp]));

  log("FINAL · ProofRegistry · verify-proof lh4");
  ok(await r(C.pr, "verify-proof", [dp, bufferCV(lh4)]));

  log("FINAL · ProofRegistry · verify-proof ih3");
  ok(await r(C.pr, "verify-proof", [dp, bufferCV(ih3)]));

  log("FINAL · ProofRegistry · verify-proof ah3");
  ok(await r(C.pr, "verify-proof", [dp, bufferCV(ah3)]));

  log("FINAL · ProofRegistry · get-proof index 2");
  ok(await r(C.pr, "get-proof", [dp, uintCV(2)]));

  log("FINAL · ProofRegistry · get-proof index 3");
  ok(await r(C.pr, "get-proof", [dp, uintCV(3)]));

  log("FINAL · IPFSExportRegistry · get-export index 2");
  ok(await r(C.ie, "get-export", [dp, uintCV(2)]));

  log("FINAL · IPFSExportRegistry · get-export index 3");
  ok(await r(C.ie, "get-export", [dp, uintCV(3)]));

  log("FINAL · IPFSExportRegistry · verify-export ech5 (FULL #2)");
  ok(await r(C.ie, "verify-export", [dp, bufferCV(ech5)]));

  log("FINAL · IPFSExportRegistry · verify-export ech6 (ANALYTICS #2)");
  ok(await r(C.ie, "verify-export", [dp, bufferCV(ech6)]));

  log("FINAL · WellnessProtocol · get-progress pid2");
  ok(await r(C.wp, "get-progress", [uintCV(pid2), dp]));

  log("FINAL · GrowthIdentity · get-app-count");
  ok(await r(C.gi, "get-app-count", []));

  log("FINAL · ProfileAnchor · get-profile-hash");
  ok(await r(C.pa, "get-profile-hash", [dp]));

  log("FINAL · ProfileAnchor · get-updated-at");
  ok(await r(C.pa, "get-updated-at", [dp]));

  console.log("\n" + "═".repeat(64));
  console.log(` ${n} interactions completed on Stacks Bitcoin Mainnet ✓`);
  console.log(` Explorer: https://explorer.hiro.so/?chain=mainnet`);
  console.log("═".repeat(64));
}

main().catch(e => { console.error(e); process.exitCode = 1; });
