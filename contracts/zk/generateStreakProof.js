/**
 * generateStreakProof.js
 *
 * Generates a Groth16 ZK proof that streakDays >= minStreak.
 * Run from contracts/ directory:
 *   node zk/generateStreakProof.js <streakDays> <minStreak> <salt>
 *
 * Outputs the calldata for ZKStreakVerifier.proveStreak().
 */
const snarkjs = require("snarkjs");
const { buildPoseidon } = require("circomlibjs");
const path = require("path");

async function main() {
  const [,, streakDaysArg, minStreakArg, saltArg] = process.argv;
  if (!streakDaysArg || !minStreakArg || !saltArg) {
    console.error("Usage: node generateStreakProof.js <streakDays> <minStreak> <salt>");
    process.exit(1);
  }

  const streakDays = BigInt(streakDaysArg);
  const minStreak  = BigInt(minStreakArg);
  const salt       = BigInt(saltArg);

  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  const nullifier        = F.toObject(poseidon([salt]));
  const streakCommitment = F.toObject(poseidon([streakDays, salt]));

  const input = {
    streakDays:        streakDays.toString(),
    salt:              salt.toString(),
    nullifier:         nullifier.toString(),
    streakCommitment:  streakCommitment.toString(),
    minStreak:         minStreak.toString(),
  };

  const wasmPath = path.join(__dirname, "build/StreakThreshold_js/StreakThreshold.wasm");
  const zkeyPath = path.join(__dirname, "keys/streak_final.zkey");

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

  // Format for Solidity calldata
  const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);

  console.log("\n── Proof generated ──────────────────────────────────────");
  console.log("nullifier       :", nullifier.toString());
  console.log("streakCommitment:", streakCommitment.toString());
  console.log("minStreak       :", minStreak.toString());
  console.log("\n── Solidity calldata (paste into proveStreak()) ─────────");
  console.log(calldata);
}

main().catch((e) => { console.error(e); process.exit(1); });
