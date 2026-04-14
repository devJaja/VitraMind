// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title ProofRegistry
/// @notice Immutable registry of hashed proofs: daily logs, AI insights, habit streaks.
///         Raw content never stored — only commitments.
contract ProofRegistry {
    enum ProofType { LOG, INSIGHT, STREAK, ACHIEVEMENT }

    struct Proof {
        bytes32 hash;
        ProofType proofType;
        uint256 timestamp;
    }

    mapping(address => Proof[]) private _proofs;
    mapping(address => mapping(bytes32 => bool)) private _exists;

    event ProofSubmitted(
        address indexed user,
        bytes32 indexed hash,
        ProofType indexed proofType,
        uint256 timestamp
    );

    function submitProof(bytes32 hash, ProofType proofType) external {
        require(hash != bytes32(0), "Invalid hash");
        require(!_exists[msg.sender][hash], "Duplicate proof");
        _exists[msg.sender][hash] = true;
        _proofs[msg.sender].push(Proof(hash, proofType, block.timestamp));
        emit ProofSubmitted(msg.sender, hash, proofType, block.timestamp);
    }

    function proofCount(address user) external view returns (uint256) {
        return _proofs[user].length;
    }

    function getProof(address user, uint256 index) external view returns (Proof memory) {
        require(index < _proofs[user].length, "Out of bounds");
        return _proofs[user][index];
    }

    function verifyProof(address user, bytes32 hash) external view returns (bool) {
        return _exists[user][hash];
    }
}
