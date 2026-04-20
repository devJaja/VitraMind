#!/usr/bin/env node
/**
 * verify-stacks.js
 * Check deployment status of all VitraMind Clarity contracts on Stacks.
 *
 * Usage:
 *   node scripts/verify-stacks.js --network testnet
 *   node scripts/verify-stacks.js --network mainnet
 *
 * Reads deployments.stacks.<network>.json produced by deploy-stacks.js.
 */

const path = require("path");
const fs   = require("fs");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const args    = process.argv.slice(2);
const netFlag = args[args.indexOf("--network") + 1] || process.env.STACKS_NETWORK || "testnet";

const API_BASE = netFlag === "mainnet"
  ? "https://api.hiro.so"
  : "https://api.testnet.hiro.so";

const deploymentsPath = path.join(__dirname, `../deployments.stacks.${netFlag}.json`);
if (!fs.existsSync(deploymentsPath)) {
  console.error(`No deployments file found: ${deploymentsPath}`);
  console.error("Run deploy-stacks.js first.");
  process.exit(1);
}

const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
console.log(`Network: ${netFlag}  |  Deployed: ${deployments.deployedAt}`);
console.log("─".repeat(60));

async function checkTx(name, txid) {
  const url = `${API_BASE}/extended/v1/tx/${txid}`;
  const res  = await fetch(url);
  if (!res.ok) return `HTTP ${res.status}`;
  const data = await res.json();
  return data.tx_status ?? "unknown";
}

async function main() {
  for (const [name, info] of Object.entries(deployments.contracts)) {
    const status = await checkTx(name, info.txid);
    const icon = status === "success" ? "✓" : status === "pending" ? "⏳" : "✗";
    console.log(`${icon}  ${name.padEnd(24)} ${status.padEnd(12)} txid: ${info.txid}`);
  }
  console.log("─".repeat(60));
  console.log(`Explorer: https://explorer.hiro.so/?chain=${netFlag}`);
}

main().catch(e => { console.error(e); process.exit(1); });
