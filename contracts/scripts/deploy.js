const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function deployWithRetry(factory, args = [], retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const contract = await ethers.deployContract(factory, args);
      await contract.waitForDeployment();
      return contract;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`  ↻ retry ${i + 1}/${retries - 1}...`);
      await new Promise(r => setTimeout(r, 4000));
    }
  }
}

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
  const ProfileAnchor = await deployWithRetry("ProfileAnchor");
  console.log("ProfileAnchor      :", await ProfileAnchor.getAddress());

  const ProofRegistry = await deployWithRetry("ProofRegistry");
  console.log("ProofRegistry      :", await ProofRegistry.getAddress());

  // ── Phase 2 ────────────────────────────────────────────────────────────────
  const MetadataRenderer = await deployWithRetry("MetadataRenderer");
  console.log("MetadataRenderer   :", await MetadataRenderer.getAddress());

  const GrowthNFT = await deployWithRetry("GrowthNFT", [ORACLE_ADDRESS]);
  console.log("GrowthNFT          :", await GrowthNFT.getAddress());

  await (await GrowthNFT.setRenderer(await MetadataRenderer.getAddress())).wait();
  console.log("GrowthNFT renderer set ✓");

  const StreakVerifier = await deployWithRetry("StreakVerifier", [ORACLE_ADDRESS]);
  console.log("StreakVerifier      :", await StreakVerifier.getAddress());

  const AnalyticsRegistry = await deployWithRetry("AnalyticsRegistry", [ORACLE_ADDRESS]);
  console.log("AnalyticsRegistry  :", await AnalyticsRegistry.getAddress());

  const RewardsEngine = await deployWithRetry("RewardsEngine", [CUSD_ADDRESS, ORACLE_ADDRESS]);
  console.log("RewardsEngine      :", await RewardsEngine.getAddress());

  // ── Phase 3 ────────────────────────────────────────────────────────────────
  // Deploy Groth16Verifier (real snarkjs-generated verifier) then ZKStreakVerifier
  const Groth16Verifier = await deployWithRetry("Groth16Verifier");
  const groth16VerifierAddress = await Groth16Verifier.getAddress();
  console.log("Groth16Verifier    :", groth16VerifierAddress);

  const ZKStreakVerifier = await deployWithRetry("ZKStreakVerifier", [groth16VerifierAddress]);
  const zkStreakVerifierAddress = await ZKStreakVerifier.getAddress();
  console.log("ZKStreakVerifier    :", zkStreakVerifierAddress);

  const IPFSExportRegistry = await deployWithRetry("IPFSExportRegistry");
  console.log("IPFSExportRegistry :", await IPFSExportRegistry.getAddress());

  const GrowthIdentity = await deployWithRetry("GrowthIdentity");
  console.log("GrowthIdentity     :", await GrowthIdentity.getAddress());

  const WellnessProtocol = await deployWithRetry("WellnessProtocol");
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
    Groth16Verifier:     groth16VerifierAddress,
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
