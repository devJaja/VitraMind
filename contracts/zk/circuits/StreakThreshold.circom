pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

/*
 * StreakThreshold
 *
 * Proves that streakDays >= minStreak without revealing streakDays.
 *
 * Private inputs : streakDays, salt
 * Public  inputs : nullifier        = Poseidon(userAddress, salt)
 *                  streakCommitment = Poseidon(streakDays, salt)
 *                  minStreak        (threshold being proven)
 */
template StreakThreshold() {
    // Private
    signal input streakDays;
    signal input salt;

    // Public
    signal input nullifier;
    signal input streakCommitment;
    signal input minStreak;

    // 1. Verify nullifier = Poseidon(salt)
    //    (userAddress is bound off-chain via msg.sender in the contract)
    component nullHash = Poseidon(1);
    nullHash.inputs[0] <== salt;
    nullifier === nullHash.out;

    // 2. Verify streakCommitment = Poseidon(streakDays, salt)
    component commitHash = Poseidon(2);
    commitHash.inputs[0] <== streakDays;
    commitHash.inputs[1] <== salt;
    streakCommitment === commitHash.out;

    // 3. Prove streakDays >= minStreak
    component gte = GreaterEqThan(32); // 32-bit comparison covers streaks up to ~11 years
    gte.in[0] <== streakDays;
    gte.in[1] <== minStreak;
    gte.out === 1;
}

component main { public [nullifier, streakCommitment, minStreak] } = StreakThreshold();
