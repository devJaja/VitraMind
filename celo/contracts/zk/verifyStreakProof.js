/**
 * verifyStreakProof.js
 *
 * Off-chain verification of a Groth16 streak proof using the verification key.
 * Use this in the backend/oracle before submitting on-chain to avoid wasted gas.
 *
 * Usage:
 *   node zk/verifyStreakProof.js '<calldata>'
 *
 * Where <calldata> is the JSON array output from generateStreakProof.js
 */
const snarkjs = require("snarkjs");
const path    = require("path");
const fs      = require("fs");

async function main() {
  const calldataArg = process.argv[2];
  if (!calldataArg) {
    console.error("Usage: node verifyStreakProof.js '<calldata JSON>'");
    process.exit(1);
  }

  // calldata format: [pA, pB, pC, pubSignals] as JSON arrays
  const [pA, pB, pC, pubSignals] = JSON.parse(`[${calldataArg}]`);

  const vkeyPath = path.join(__dirname, "keys/verification_key.json");
  if (!fs.existsSync(vkeyPath)) {
    console.error("verification_key.json not found — run trusted setup first");
    process.exit(1);
  }
  const vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));

  const proof = {
    pi_a: pA,
    pi_b: pB,
    pi_c: pC,
    protocol: "groth16",
    curve: "bn128",
  };

  const isValid = await snarkjs.groth16.verify(vkey, pubSignals, proof);
  console.log(isValid ? "✓ Proof is VALID" : "✗ Proof is INVALID");
  process.exit(isValid ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
