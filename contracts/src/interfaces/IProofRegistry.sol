// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title IProofRegistry
/// @notice Interface for ProofRegistry — enables other contracts to verify proofs
interface IProofRegistry {
    enum ProofType { LOG, INSIGHT, STREAK, ACHIEVEMENT }

    function submitProof(bytes32 hash, ProofType proofType) external;
    function verifyProof(address user, bytes32 hash) external view returns (bool);
    function proofCount(address user) external view returns (uint256);
}
