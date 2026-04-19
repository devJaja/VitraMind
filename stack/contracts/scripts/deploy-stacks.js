#!/usr/bin/env node
/**
 * deploy-stacks.js
 * Deploy VitraMind Clarity contracts to Stacks testnet or mainnet.
 *
 * Usage:
 *   node scripts/deploy-stacks.js --network testnet
 *   node scripts/deploy-stacks.js --network mainnet
 *
 * Requires:
 *   STACKS_PRIVATE_KEY  — deployer private key (hex, no 0x prefix)
 *   STACKS_NETWORK      — "testnet" | "mainnet" (overridden by --network flag)
 *
 * Install deps:  npm install @stacks/transactions @stacks/network
 */

const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} = require("@stacks/transactions");
const { StacksTestnet, StacksMainnet } = require("@stacks/network");
const fs   = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const args    = process.argv.slice(2);
const netFlag = args[args.indexOf("--network") + 1] || process.env.STACKS_NETWORK || "testnet";
const network = netFlag === "mainnet" ? new StacksMainnet() : new StacksTestnet();

const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("Missing env: STACKS_PRIVATE_KEY");

const CONTRACTS_DIR = path.join(__dirname, "../clarity/contracts");

// Deployment order matters — no inter-contract dependencies here, but keep logical order
const CONTRACT_NAMES = [
  "profile-anchor",
  "proof-registry",
  "streak-verifier",
  "analytics-registry",
  "ipfs-export-registry",
  "growth-identity",
  "wellness-protocol",
];

async function deployContract(name) {
  const codeBody = fs.readFileSync(path.join(CONTRACTS_DIR, `${name}.clar`), "utf8");

  const tx = await makeContractDeploy({
    contractName: name,
    codeBody,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 100_000n, // 0.1 STX — adjust if needed
  });

  const result = await broadcastTransaction({ transaction: tx, network });
  if (result.error) throw new Error(`${name}: ${result.error} — ${result.reason}`);
  return result.txid;
}

async function main() {
  console.log(`Network: ${netFlag}`);
  console.log("─".repeat(52));

  const deployments = { network: netFlag, deployedAt: new Date().toISOString(), contracts: {} };

  for (const name of CONTRACT_NAMES) {
    process.stdout.write(`Deploying ${name}... `);
    const txid = await deployContract(name);
    console.log(`txid: ${txid}`);
    deployments.contracts[name] = { txid };
  }

  const outPath = path.join(__dirname, `../deployments.stacks.${netFlag}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));
  console.log("─".repeat(52));
  console.log(`Deployment saved to: ${outPath}`);
  console.log("Note: contracts are pending until transactions confirm (~10 min each).");
}

main().catch((e) => { console.error(e); process.exit(1); });
