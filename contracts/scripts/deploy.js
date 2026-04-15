const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

// Known cUSD addresses
// Alfajores testnet: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
// Celo mainnet:      0x765DE816845861e75A25fCA122bb6898B8B1282a
const CUSD_ADDRESS   = process.env.CUSD_ADDRESS;
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS;

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

  // Attach renderer to GrowthNFT
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

  // Persist deployment addresses
  const deployments = {
    network:           network.name,
    chainId:           network.chainId.toString(),
    deployer:          deployer.address,
    ProfileAnchor:     await ProfileAnchor.getAddress(),
    ProofRegistry:     await ProofRegistry.getAddress(),
    MetadataRenderer:  await MetadataRenderer.getAddress(),
    GrowthNFT:         await GrowthNFT.getAddress(),
    StreakVerifier:    await StreakVerifier.getAddress(),
    AnalyticsRegistry: await AnalyticsRegistry.getAddress(),
    RewardsEngine:     await RewardsEngine.getAddress(),
    deployedAt:        new Date().toISOString(),
  };

  const outPath = path.join(__dirname, `../deployments.${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));
  console.log("─".repeat(52));
  console.log(`Deployment saved to: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
