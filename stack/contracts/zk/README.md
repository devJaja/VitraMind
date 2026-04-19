# ZK Streak Verification

VitraMind uses Groth16 zero-knowledge proofs to let users prove their habit streak meets a threshold — without revealing the actual streak count.

## Circuit: `StreakThreshold`

**Private inputs:** `streakDays`, `salt`  
**Public inputs:** `nullifier`, `streakCommitment`, `minStreak`

Proves `streakDays >= minStreak` using Poseidon hashing and a 32-bit `GreaterEqThan` comparator from circomlib.

## Setup (already done for mainnet)

```bash
# 1. Compile circuit
circom zk/circuits/StreakThreshold.circom --r1cs --wasm --sym -o zk/build -l .

# 2. Trusted setup
snarkjs powersoftau new bn128 12 zk/keys/pot12_0000.ptau
snarkjs powersoftau contribute zk/keys/pot12_0000.ptau zk/keys/pot12_0001.ptau
snarkjs powersoftau prepare phase2 zk/keys/pot12_0001.ptau zk/keys/pot12_final.ptau
snarkjs groth16 setup zk/build/StreakThreshold.r1cs zk/keys/pot12_final.ptau zk/keys/streak_0000.zkey
snarkjs zkey contribute zk/keys/streak_0000.zkey zk/keys/streak_final.zkey
snarkjs zkey export solidityverifier zk/keys/streak_final.zkey src/Groth16Verifier.sol

# 3. Deploy
npm run deploy:verifier:celo
```

## Generate a proof

```bash
npm run zk:prove -- <streakDays> <minStreak> <salt>
# e.g.
npm run zk:prove -- 30 7 123456789
```

Outputs Solidity calldata ready to pass to `ZKStreakVerifier.proveStreak()`.

## Mainnet contracts

| Contract | Address |
|---|---|
| `Groth16Verifier` | `0x6C23D31A1917D50d9638Ee67ddCc99962D372F90` |
| `ZKStreakVerifier` | `0xC3333e5f5c29B624B40fc8E7D3F70Ec71CED558B` |
