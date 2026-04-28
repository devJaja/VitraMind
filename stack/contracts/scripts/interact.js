/**
 * VitraMind Mainnet Interaction Script
 * Network: Celo Mainnet (chainId: 42220)
 * Run: node scripts/interact.js
 */

require("dotenv").config();
const { ethers } = require("ethers");

// Fallback RPC list — tries each in order until one works
const RPCS = [
  "https://forno.celo.org",
  "https://rpc.ankr.com/celo",
  "https://celo.drpc.org",
];

async function getProvider() {
  for (const url of RPCS) {
    try {
      const p = new ethers.JsonRpcProvider(url, { chainId: 42220, name: "celo" }, { staticNetwork: true });
      await p.getBlockNumber();
      console.log("   RPC:", url);
      return p;
    } catch (_) {}
  }
  throw new Error("All RPCs failed");
}

// ── Deployed addresses ────────────────────────────────────────────────────────
const ADDRESSES = {
  ProfileAnchor:      "0x5930dD01989847697dB0F4240890F78eD6AC4577",
  ProofRegistry:      "0x4501199B23d6f29ebe5f3af55118708cFF8e6f2b",
  IPFSExportRegistry: "0x414A8B156808479B741Df1C9EF5E0Ea5208Fd80A",
  WellnessProtocol:   "0xD8Ad321862084080732D745335f6370AddF3F380",
  GrowthIdentity:     "0xB0e26442A400931972821351f01EfE1fF91C4d0A",
  GrowthNFT:          "0xB225effE84D95B4874842c94f04c8EA6183e39c1",
  RewardsEngine:      "0x4e0dc019d7Ca54A31b9A9929d394AEf3E1396557",
  StreakVerifier:     "0xc55D27d217cd6ABfa666bdd7CD29Aa2B7b2977d4",
  AnalyticsRegistry:  "0xA675088563DfB9f280140eFa297D878649159256",
};

const ABI = {
  ProfileAnchor: [
    "function anchorProfile(bytes32 hash) external",
    "function profileHash(address) external view returns (bytes32)",
    "function hasProfile(address) external view returns (bool)",
    "function updatedAt(address) external view returns (uint256)",
  ],
  ProofRegistry: [
    "function submitProof(bytes32 hash, uint8 proofType) external",
    "function proofCount(address user) external view returns (uint256)",
    "function verifyProof(address user, bytes32 hash) external view returns (bool)",
    "function getProof(address user, uint256 index) external view returns (tuple(bytes32 hash, uint8 proofType, uint256 timestamp))",
  ],
  IPFSExportRegistry: [
    "function anchorExport(string calldata cid, bytes32 contentHash, uint8 exportType) external",
    "function exportCount(address user) external view returns (uint256)",
    "function latestExport(address user) external view returns (tuple(string cid, bytes32 contentHash, uint8 exportType, uint256 timestamp))",
    "function verifyExport(address user, bytes32 contentHash) external view returns (bool)",
  ],
  WellnessProtocol: [
    "function registerProtocol(string calldata name, string calldata schemaCID) external returns (uint256)",
    "function optIn(uint256 protocolId) external",
    "function commitProgress(uint256 protocolId, bytes32 commitmentHash) external",
    "function optOut(uint256 protocolId) external",
    "function protocolCount() external view returns (uint256)",
    "function protocols(uint256) external view returns (string name, string schemaCID, address creator, bool active, uint256 createdAt)",
    "function optedIn(uint256, address) external view returns (bool)",
    "function progress(uint256, address) external view returns (bytes32 commitmentHash, uint256 updatedAt)",
  ],
  GrowthIdentity: [
    "function publishIdentity(bytes32 commitment, uint8 growthLevel) external",
    "function hasActiveIdentity(address user) external view returns (bool)",
    "function identities(address) external view returns (bytes32 commitment, uint8 growthLevel, uint256 publishedAt, bool active)",
    "function appCount() external view returns (uint256)",
  ],
  GrowthNFT: [
    "function tokenOfOwner(address) external view returns (uint256)",
    "function growthData(uint256) external view returns (uint8 level, uint32 streakDays, uint32 totalLogs, uint256 mintedAt, string metadataURI)",
    "function oracle() external view returns (address)",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
  ],
  RewardsEngine: [
    "function rewards(address) external view returns (uint256 points, uint256 claimedCUSD, uint256 lastRewardAt, uint32 highestStreakRewarded)",
    "function contractBalance() external view returns (uint256)",
    "function oracle() external view returns (address)",
    "function streakReward1() external view returns (uint256)",
    "function streakReward2() external view returns (uint256)",
    "function streakReward3() external view returns (uint256)",
  ],
  StreakVerifier: [
    "function streakCount(address user) external view returns (uint256)",
    "function oracle() external view returns (address)",
    "function COOLDOWN() external view returns (uint256)",
  ],
  AnalyticsRegistry: [
    "function snapshotCount(address user) external view returns (uint256)",
    "function oracle() external view returns (address)",
  ],
};

const log  = (n, msg) => console.log(`\n[${String(n).padStart(2,"0")}] ${msg}`);
const hash = (s)      => ethers.keccak256(ethers.toUtf8Bytes(s));

async function main() {
  const provider = await getProvider();
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const addr     = wallet.address;

  console.log("═".repeat(60));
  console.log(" VitraMind — Celo Mainnet Interactions");
  console.log(`  Signer : ${addr}`);
  console.log("═".repeat(60));

  const pa  = new ethers.Contract(ADDRESSES.ProfileAnchor,      ABI.ProfileAnchor,      wallet);
  const pr  = new ethers.Contract(ADDRESSES.ProofRegistry,      ABI.ProofRegistry,      wallet);
  const ie  = new ethers.Contract(ADDRESSES.IPFSExportRegistry, ABI.IPFSExportRegistry, wallet);
  const wp  = new ethers.Contract(ADDRESSES.WellnessProtocol,   ABI.WellnessProtocol,   wallet);
  const gi  = new ethers.Contract(ADDRESSES.GrowthIdentity,     ABI.GrowthIdentity,     wallet);
  const nft = new ethers.Contract(ADDRESSES.GrowthNFT,          ABI.GrowthNFT,          wallet);
  const re  = new ethers.Contract(ADDRESSES.RewardsEngine,      ABI.RewardsEngine,      wallet);
  const sv  = new ethers.Contract(ADDRESSES.StreakVerifier,     ABI.StreakVerifier,     wallet);
  const ar  = new ethers.Contract(ADDRESSES.AnalyticsRegistry,  ABI.AnalyticsRegistry,  wallet);

  // ── READS ─────────────────────────────────────────────────────────────────

  log(1, "ProfileAnchor.hasProfile()");
  console.log("  ", await pa.hasProfile(addr));

  log(2, "ProfileAnchor.profileHash()");
  console.log("  ", await pa.profileHash(addr));

  log(3, "ProfileAnchor.updatedAt()");
  const updAt = await pa.updatedAt(addr);
  console.log("   updatedAt:", new Date(Number(updAt) * 1000).toISOString());

  log(4, "ProofRegistry.proofCount()");
  const pc0 = await pr.proofCount(addr);
  console.log("   proofCount:", pc0.toString());

  log(5, "ProofRegistry.getProof(0)");
  const p0 = await pr.getProof(addr, 0);
  console.log("   hash:", p0.hash, "| type:", p0.proofType.toString());

  log(6, "WellnessProtocol.protocolCount()");
  const wCount = await wp.protocolCount();
  console.log("   protocolCount:", wCount.toString());

  log(7, "WellnessProtocol.protocols(0)");
  const proto0 = await wp.protocols(0);
  console.log("   name:", proto0.name, "| active:", proto0.active);

  log(8, "GrowthNFT.name() + symbol()");
  const [nftName, nftSym] = await Promise.all([nft.name(), nft.symbol()]);
  console.log("  ", nftName, "/", nftSym);

  log(9, "GrowthNFT.oracle()");
  console.log("   oracle:", await nft.oracle());

  log(10, "GrowthNFT.tokenOfOwner()");
  const tid = await nft.tokenOfOwner(addr);
  console.log("   tokenId:", tid.toString());

  log(11, "RewardsEngine.oracle() + contractBalance()");
  const [reOracle, reBal] = await Promise.all([re.oracle(), re.contractBalance()]);
  console.log("   oracle:", reOracle);
  console.log("   balance:", ethers.formatEther(reBal), "cUSD");

  log(12, "RewardsEngine streak reward tiers");
  const [r1, r2, r3] = await Promise.all([re.streakReward1(), re.streakReward2(), re.streakReward3()]);
  console.log(`   ${ethers.formatEther(r1)} / ${ethers.formatEther(r2)} / ${ethers.formatEther(r3)} cUSD`);

  log(13, "RewardsEngine.rewards(signer)");
  const rw = await re.rewards(addr);
  console.log("   points:", rw.points.toString(), "| claimedCUSD:", ethers.formatEther(rw.claimedCUSD));

  log(14, "StreakVerifier.streakCount() + COOLDOWN()");
  const [sc, cd] = await Promise.all([sv.streakCount(addr), sv.COOLDOWN()]);
  console.log("   streakCount:", sc.toString(), "| cooldown:", (Number(cd)/3600) + "h");

  log(15, "AnalyticsRegistry.snapshotCount()");
  console.log("   snapshotCount:", (await ar.snapshotCount(addr)).toString());

  log(16, "GrowthIdentity.hasActiveIdentity() + appCount()");
  const [hasId, appCnt] = await Promise.all([gi.hasActiveIdentity(addr), gi.appCount()]);
  console.log("   hasActiveIdentity:", hasId, "| appCount:", appCnt.toString());

  log(17, "GrowthIdentity.identities(signer)");
  const id0 = await gi.identities(addr);
  console.log("   level:", id0.growthLevel.toString(), "| active:", id0.active);

  log(18, "IPFSExportRegistry.exportCount()");
  const ec0 = await ie.exportCount(addr);
  console.log("   exportCount:", ec0.toString());

  log(19, "IPFSExportRegistry.latestExport()");
  const lex = await ie.latestExport(addr);
  console.log("   cid:", lex.cid, "| type:", lex.exportType.toString());

  // ── WRITES ────────────────────────────────────────────────────────────────

  log(20, "ProfileAnchor.anchorProfile() — write");
  const ph = hash(`profile-${addr}-${Date.now()}`);
  const t20 = await pa.anchorProfile(ph);
  await t20.wait();
  console.log("   tx:", t20.hash);

  log(21, "ProfileAnchor.hasProfile() + profileHash() — verify");
  const [hasPro, storedPh] = await Promise.all([pa.hasProfile(addr), pa.profileHash(addr)]);
  console.log("   hasProfile:", hasPro, "| hash matches:", storedPh === ph);

  log(22, "ProofRegistry.submitProof(LOG=0)");
  const lh = hash(`log-${addr}-${Date.now()}`);
  const t22 = await pr.submitProof(lh, 0);
  await t22.wait();
  console.log("   tx:", t22.hash);

  log(23, "ProofRegistry.submitProof(INSIGHT=1)");
  const ih = hash(`insight-${addr}-${Date.now()}`);
  const t23 = await pr.submitProof(ih, 1);
  await t23.wait();
  console.log("   tx:", t23.hash);

  log(24, "ProofRegistry.submitProof(STREAK=2)");
  const sh = hash(`streak-${addr}-${Date.now()}`);
  const t24 = await pr.submitProof(sh, 2);
  await t24.wait();
  console.log("   tx:", t24.hash);

  log(25, "ProofRegistry.submitProof(ACHIEVEMENT=3)");
  const ah = hash(`achievement-${addr}-${Date.now()}`);
  const t25 = await pr.submitProof(ah, 3);
  await t25.wait();
  console.log("   tx:", t25.hash);

  log(26, "ProofRegistry.verifyProof() — all 4 types");
  const [v0,v1,v2,v3] = await Promise.all([
    pr.verifyProof(addr, lh), pr.verifyProof(addr, ih),
    pr.verifyProof(addr, sh), pr.verifyProof(addr, ah),
  ]);
  console.log("   LOG:", v0, "INSIGHT:", v1, "STREAK:", v2, "ACHIEVEMENT:", v3);

  log(27, "ProofRegistry.proofCount() — after writes");
  console.log("   proofCount:", (await pr.proofCount(addr)).toString());

  log(28, "WellnessProtocol.registerProtocol()");
  const t28 = await wp.registerProtocol(`Wellness-${Date.now()}`, "QmWellnessSchemaCID");
  await t28.wait();
  const newProtocolId = wCount; // id = count before registration
  console.log("   tx:", t28.hash, "| protocolId:", newProtocolId.toString());

  log(29, "WellnessProtocol.optIn(protocolId)");
  const t29 = await wp.optIn(newProtocolId);
  await t29.wait();
  console.log("   tx:", t29.hash);

  log(30, "WellnessProtocol.optedIn() — verify");
  console.log("   optedIn:", await wp.optedIn(newProtocolId, addr));

  log(31, "WellnessProtocol.commitProgress()");
  const cp = hash(`progress-${addr}-${Date.now()}`);
  const t31 = await wp.commitProgress(newProtocolId, cp);
  await t31.wait();
  console.log("   tx:", t31.hash);

  log(32, "WellnessProtocol.progress() — verify");
  const prog = await wp.progress(newProtocolId, addr);
  console.log("   stored:", prog.commitmentHash, "| matches:", prog.commitmentHash === cp);

  log(33, "WellnessProtocol.optOut()");
  const t33 = await wp.optOut(newProtocolId);
  await t33.wait();
  console.log("   tx:", t33.hash);
  console.log("   optedIn after optOut:", await wp.optedIn(newProtocolId, addr));

  log(34, "GrowthIdentity.publishIdentity() — level 15");
  const ic = hash(`identity-level15-${addr}-${Date.now()}`);
  const t34 = await gi.publishIdentity(ic, 15);
  await t34.wait();
  console.log("   tx:", t34.hash);

  log(35, "GrowthIdentity.identities() — verify level 15");
  const id1 = await gi.identities(addr);
  console.log("   growthLevel:", id1.growthLevel.toString(), "| active:", id1.active);

  log(36, "IPFSExportRegistry.anchorExport(FULL=0)");
  const ech1 = hash(`export-full-${addr}-${Date.now()}`);
  const t36 = await ie.anchorExport("QmVitraMindFullExportRun3", ech1, 0);
  await t36.wait();
  console.log("   tx:", t36.hash);

  log(37, "IPFSExportRegistry.anchorExport(ANALYTICS=3)");
  const ech2 = hash(`export-analytics-${addr}-${Date.now()}`);
  const t37 = await ie.anchorExport("QmVitraMindAnalyticsExportRun3", ech2, 3);
  await t37.wait();
  console.log("   tx:", t37.hash);

  log(38, "IPFSExportRegistry.verifyExport() — both exports");
  const [ev1, ev2] = await Promise.all([
    ie.verifyExport(addr, ech1),
    ie.verifyExport(addr, ech2),
  ]);
  console.log("   FULL verified:", ev1, "| ANALYTICS verified:", ev2);

  log(39, "IPFSExportRegistry.exportCount() — final");
  console.log("   exportCount:", (await ie.exportCount(addr)).toString());

  log(40, "IPFSExportRegistry.latestExport() — final");
  const lex2 = await ie.latestExport(addr);
  console.log("   cid:", lex2.cid);

  console.log("\n" + "═".repeat(60));
  console.log(" All 40 interactions completed on Celo mainnet ✓");
  console.log("═".repeat(60));
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
