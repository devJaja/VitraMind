const { ethers } = require("hardhat");

// Known cUSD addresses
// Alfajores testnet: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
// Celo mainnet:      0x765DE816845861e75A25fCA122bb6898B8B1282a
const CUSD_ADDRESS   = process.env.CUSD_ADDRESS;
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS;

async function main() {
  if (!CUSD_ADDRESS)   throw new Error("Missing env: CUSD_ADDRESS");
  if (!ORACLE_ADDRESS) throw new Error("Missing env: ORACLE_ADDRESS");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:  ", deployer.address);
  console.log("Network:   ", (await ethers.provider.getNetwork()).name);
  console.log("Oracle:    ", ORACLE_ADDRESS);
  console.log("cUSD:      ", CUSD_ADDRESS);
  console.log("─".repeat(50));

  const ProfileAnchor = await ethers.deployContract("ProfileAnchor");
  await ProfileAnchor.waitForDeployment();
  console.log("ProfileAnchor  :", await ProfileAnchor.getAddress());

  const ProofRegistry = await ethers.deployContract("ProofRegistry");
  await ProofRegistry.waitForDeployment();
  console.log("ProofRegistry  :", await ProofRegistry.getAddress());

  const GrowthNFT = await ethers.deployContract("GrowthNFT", [ORACLE_ADDRESS]);
  await GrowthNFT.waitForDeployment();
  console.log("GrowthNFT      :", await GrowthNFT.getAddress());

  const RewardsEngine = await ethers.deployContract("RewardsEngine", [CUSD_ADDRESS, ORACLE_ADDRESS]);
  await RewardsEngine.waitForDeployment();
  console.log("RewardsEngine  :", await RewardsEngine.getAddress());

  console.log("─".repeat(50));
  console.log("All contracts deployed successfully.");
}

main().catch((e) => { console.error(e); process.exit(1); });
