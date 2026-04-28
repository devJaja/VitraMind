/**
 * Deploy new Phase-4 Clarity contracts to Stacks.
 * Contracts: goal-tracker, mood-oracle, reward-vault, leaderboard
 *
 * Usage:
 *   node scripts/deploy-phase4.js --network testnet
 *   node scripts/deploy-phase4.js --network mainnet
 */

require("dotenv").config();
const { makeContractDeploy, broadcastTransaction, AnchorMode, PostConditionMode } = require("@stacks/transactions");
const { StacksMainnet, StacksTestnet } = require("@stacks/network");
const fs = require("fs");
const path = require("path");

const NETWORK_ARG = process.argv.includes("--network")
  ? process.argv[process.argv.indexOf("--network") + 1]
  : "testnet";

const network = NETWORK_ARG === "mainnet" ? new StacksMainnet() : new StacksTestnet();
const senderKey = process.env.STACKS_PRIVATE_KEY;
if (!senderKey) throw new Error("STACKS_PRIVATE_KEY not set in .env");

const CONTRACTS = ["goal-tracker", "mood-oracle", "reward-vault", "leaderboard"];
const CLARITY_DIR = path.join(__dirname, "../clarity/contracts");

async function deploy(contractName) {
  const code = fs.readFileSync(path.join(CLARITY_DIR, `${contractName}.clar`), "utf8");
  const tx = await makeContractDeploy({
    contractName,
    codeBody: code,
    senderKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  });
  const result = await broadcastTransaction(tx, network);
  console.log(`✓ ${contractName}: ${result.txid}`);
  return result.txid;
}

async function main() {
  console.log(`Deploying Phase-4 contracts to Stacks ${NETWORK_ARG}…\n`);
  const deployed = {};
  for (const name of CONTRACTS) {
    deployed[name] = await deploy(name);
  }
  const outFile = path.join(__dirname, `../deployments.stacks.${NETWORK_ARG}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deployed, null, 2));
  console.log(`\nDeployment manifest: ${outFile}`);
}

main().catch(e => { console.error(e); process.exitCode = 1; });
