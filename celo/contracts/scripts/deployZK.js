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

async function main() {
  const [deployer] = await ethers.getSigners();
  const network    = await ethers.provider.getNetwork();
  console.log("Deployer:", deployer.address);
  console.log("Network :", network.name, `(chainId: ${network.chainId})`);

  // Deploy the mock Groth16 verifier (placeholder until real circom circuit is ready)
  const mockVerifier = await deployWithRetry("MockGroth16Verifier");
  const mockVerifierAddr = await mockVerifier.getAddress();
  console.log("MockGroth16Verifier:", mockVerifierAddr);

  // Deploy ZKStreakVerifier pointing at the mock verifier
  const zkStreakVerifier = await deployWithRetry("ZKStreakVerifier", [mockVerifierAddr]);
  const zkStreakVerifierAddr = await zkStreakVerifier.getAddress();
  console.log("ZKStreakVerifier   :", zkStreakVerifierAddr);

  // Patch the existing deployments file
  const outPath = path.join(__dirname, `../deployments.${network.name}.json`);
  const deployments = JSON.parse(fs.readFileSync(outPath, "utf8"));
  deployments.MockGroth16Verifier = mockVerifierAddr;
  deployments.ZKStreakVerifier    = zkStreakVerifierAddr;
  deployments.deployedAt          = new Date().toISOString();
  fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));
  console.log("deployments.celo.json updated ✓");
}

main().catch((e) => { console.error(e); process.exit(1); });
