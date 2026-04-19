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
      await new Promise(r => setTimeout(r, 4000));
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network    = await ethers.provider.getNetwork();

  const outPath = path.join(__dirname, `../deployments.${network.name}.json`);
  if (!fs.existsSync(outPath)) throw new Error(`deployments.${network.name}.json not found — run deploy.js first`);
  const deployments = JSON.parse(fs.readFileSync(outPath, "utf8"));

  const { ProofRegistry, RewardsEngine, GrowthNFT } = deployments;
  if (!ProofRegistry || !RewardsEngine || !GrowthNFT) throw new Error("Missing contract addresses in deployments file");

  const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS;
  if (!ORACLE_ADDRESS) throw new Error("Missing env: ORACLE_ADDRESS");

  console.log("Deploying OracleGateway...");
  const gateway = await deployWithRetry("OracleGateway", [ORACLE_ADDRESS, ProofRegistry, RewardsEngine, GrowthNFT]);
  const gatewayAddr = await gateway.getAddress();
  console.log("OracleGateway:", gatewayAddr);

  deployments.OracleGateway = gatewayAddr;
  deployments.deployedAt    = new Date().toISOString();
  fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));
  console.log("deployments updated ✓");
}

main().catch((e) => { console.error(e); process.exit(1); });
