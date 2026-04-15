const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

// Known cUSD addresses
// Alfajores testnet: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
// Celo mainnet:      0x765DE816845861e75A25fCA122bb6898B8B1282a
const CUSD_ADDRESS   = process.env.CUSD_ADDRESS;
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS;

// Phase 3: ZK verifier address (deploy your circom-generated verifier first, then set this)
// Leave empty to skip ZKStreakVerifier deployment
const ZK_VERIFIER_ADDRESS = process.env.ZK_VERIFIER_ADDRESS || "";

async function main() {
  if (!CUSD_ADDRESS)   throw new Error("Missing env: CUSD_ADDRESS");
  if (!ORACLE_ADDRESS) throw new Error("Missing env: ORACLE_ADDRESS");

  const [deployer] = await ethers.getSigners();
  const network    = await ethers.provider.getNetwork();

  console.log("Deployer:  ", deployer.address);
  console.log("Network:   ", network.name, `(chainId: ${network.chainId})`);
  console.log("Oracle:    ", ORACLE_ADDRESS);
  console.log("cUSD:      ", CUSD_ADDRESS);
  console.log("─".repeat(52));

  // ── Phase 1 ────────────────────────────────────────────────────────────────
  const ProfileAnchor = await ethers.deployContract("ProfileAnchor");
  await ProfileAnchor.waitForDeployment();
  console.log("ProfileAnchor      :", await ProfileAnchor.getAddress());

  const ProofRegistry = await ethers.deployContract("ProofRegistry");
  await ProofRegistry.waitForDeployment();
  console.log("ProofRegistry      :", await ProofRegistry.getAddress());

  // ── Phase 2 ────────────────────────────────────────────────────────────────
  const MetadataRenderer = await ethers.deployContract("MetadataRenderer");
  await MetadataRenderer.waitForDeployment();
  console.log("MetadataRenderer   :", await MetadataRenderer.getAddress());

  const GrowthNFT = await ethers.deployContract("GrowthNFT", [ORACLE_ADDRESS]);
  await GrowthNFT.waitForDeployment();
  console.log("GrowthNFT          :", await GrowthNFT.getAddress());

  await (await GrowthNFT.setRenderer(await MetadataRenderer.getAddress())).wait();
  console.log("GrowthNFT renderer set ✓");

  const StreakVerifier = await ethers.deployContract("StreakVerifier", [ORACLE_ADDRESS]);
  await StreakVerifier.waitForDeployment();
  console.log("StreakVerifier      :", await StreakVerifier.getAddress());

  const AnalyticsRegistry = await ethers.deployContract("AnalyticsRegistry", [ORACLE_ADDRESS]);
  await AnalyticsRegistry.waitForDeployment();
  console.log("AnalyticsRegistry  :", await AnalyticsRegistry.getAddress());

  const RewardsEngine = await ethers.deployContract("RewardsEngine", [CUSD_ADDRESS, ORACLE_ADDRESS]);
  await RewardsEngine.waitForDeployment();
  console.log("RewardsEngine      :", await RewardsEngine.getAddress());

  // ── Phase 3 ────────────────────────────────────────────────────────────────
  let zkStreakVerifierAddress = "";
  if (ZK_VERIFIER_ADDRESS) {
    const ZKStreakVerifier = await ethers.deployContract("ZKStreakVerifier", [ZK_VERIFIER_ADDRESS]);
    await ZKStreakVerifier.waitForDeployment();
    zkStreakVerifierAddress = await ZKStreakVerifier.getAddress();
    console.log("ZKStreakVerifier    :", zkStreakVerifierAddress);
  } else {
    console.log("ZKStreakVerifier    : skipped (set ZK_VERIFIER_ADDRESS to deploy)");
  }

  const IPFSExportRegistry = await ethers.deployContract("IPFSExportRegistry");
  await IPFSExportRegistry.waitForDeployment();
  console.log("IPFSExportRegistry :", await IPFSExportRegistry.getAddress());

  const GrowthIdentity = await ethers.deployContract("GrowthIdentity");
  await GrowthIdentity.waitForDeployment();
  console.log("GrowthIdentity     :", await GrowthIdentity.getAddress());

  const WellnessProtocol = await ethers.deployContract("WellnessProtocol");
  await WellnessProtocol.waitForDeployment();
  console.log("WellnessProtocol   :", await WellnessProtocol.getAddress());

  // Persist deployment addresses
  const deployments = {
    network:             network.name,
    chainId:             network.chainId.toString(),
    deployer:            deployer.address,
    // Phase 1
    ProfileAnchor:       await ProfileAnchor.getAddress(),
    ProofRegistry:       await ProofRegistry.getAddress(),
    // Phase 2
    MetadataRenderer:    await MetadataRenderer.getAddress(),
    GrowthNFT:           await GrowthNFT.getAddress(),
    StreakVerifier:      await StreakVerifier.getAddress(),
    AnalyticsRegistry:   await AnalyticsRegistry.getAddress(),
    RewardsEngine:       await RewardsEngine.getAddress(),
    // Phase 3
    ZKStreakVerifier:    zkStreakVerifierAddress,
    IPFSExportRegistry:  await IPFSExportRegistry.getAddress(),
    GrowthIdentity:      await GrowthIdentity.getAddress(),
    WellnessProtocol:    await WellnessProtocol.getAddress(),
    deployedAt:          new Date().toISOString(),
  };

  const outPath = path.join(__dirname, `../deployments.${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));
  console.log("─".repeat(52));
  console.log(`Deployment saved to: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
