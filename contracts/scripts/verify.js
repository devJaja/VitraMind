const { ethers } = require("hardhat");

/**
 * verify.js — Verify all deployed contracts on Celoscan
 * Usage: CELO_API_KEY=xxx npx hardhat run scripts/verify.js --network celo
 */
async function main() {
  const fs   = require("fs");
  const path = require("path");

  const network = await ethers.provider.getNetwork();
  const outPath = path.join(__dirname, `../deployments.${network.name}.json`);
  if (!fs.existsSync(outPath)) throw new Error("deployments file not found");

  const d = JSON.parse(fs.readFileSync(outPath, "utf8"));
  const ORACLE = process.env.ORACLE_ADDRESS;
  const CUSD   = process.env.CUSD_ADDRESS;

  const contracts = [
    { name: "ProfileAnchor",      address: d.ProfileAnchor,      args: [] },
    { name: "ProofRegistry",      address: d.ProofRegistry,      args: [] },
    { name: "MetadataRenderer",   address: d.MetadataRenderer,   args: [] },
    { name: "GrowthNFT",          address: d.GrowthNFT,          args: [ORACLE] },
    { name: "StreakVerifier",      address: d.StreakVerifier,     args: [ORACLE] },
    { name: "AnalyticsRegistry",  address: d.AnalyticsRegistry,  args: [ORACLE] },
    { name: "RewardsEngine",      address: d.RewardsEngine,      args: [CUSD, ORACLE] },
    { name: "IPFSExportRegistry", address: d.IPFSExportRegistry, args: [] },
    { name: "GrowthIdentity",     address: d.GrowthIdentity,     args: [] },
    { name: "WellnessProtocol",   address: d.WellnessProtocol,   args: [] },
    { name: "Groth16Verifier",    address: d.Groth16Verifier,    args: [] },
    { name: "ZKStreakVerifier",    address: d.ZKStreakVerifier,   args: [d.Groth16Verifier] },
  ];

  for (const { name, address, args } of contracts) {
    if (!address) { console.log(`⏭  ${name}: no address`); continue; }
    try {
      await hre.run("verify:verify", { address, constructorArguments: args });
      console.log(`✓  ${name}: verified`);
    } catch (e) {
      console.log(`✗  ${name}: ${e.message?.slice(0, 80)}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
