// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title ProofRegistry
/// @notice Immutable, append-only registry of hashed proofs for daily logs, AI insights, and habit streaks.
/// @dev    Raw content is never stored — only keccak256 commitments.
///         A secondary mapping provides O(1) duplicate detection and verification.
contract ProofRegistry {
    /// @notice Categories of proof that can be submitted
    enum ProofType { LOG, INSIGHT, STREAK, ACHIEVEMENT }

    /// @notice A single proof entry
    struct Proof {
        bytes32   hash;
        ProofType proofType;
        uint256   timestamp;
    }

    /// @dev user => ordered list of proofs
    mapping(address => Proof[]) private _proofs;

    /// @dev user => hash => exists — enables O(1) verification and duplicate rejection
    mapping(address => mapping(bytes32 => bool)) private _exists;

    /// @notice Emitted when a new proof is submitted
    /// @param user      Submitting address
    /// @param hash      keccak256 commitment
    /// @param proofType Category of the proof
    /// @param timestamp Block timestamp
    event ProofSubmitted(
        address indexed user,
        bytes32 indexed hash,
        ProofType indexed proofType,
        uint256 timestamp
    );

    /// @notice Submit a new proof commitment
    /// @param hash      keccak256 of the off-chain content
    /// @param proofType Category of proof
    function submitProof(bytes32 hash, ProofType proofType) external {
        require(hash != bytes32(0), "Invalid hash");
        require(!_exists[msg.sender][hash], "Duplicate proof");
        _exists[msg.sender][hash] = true;
        _proofs[msg.sender].push(Proof(hash, proofType, block.timestamp));
        emit ProofSubmitted(msg.sender, hash, proofType, block.timestamp);
    }

    /// @notice Returns the total number of proofs submitted by a user
    function proofCount(address user) external view returns (uint256) {
        return _proofs[user].length;
    }

    /// @notice Fetch a specific proof by index
    /// @param user  Address of the user
    /// @param index Zero-based index into the user's proof list
    function getProof(address user, uint256 index) external view returns (Proof memory) {
        require(index < _proofs[user].length, "Out of bounds");
        return _proofs[user][index];
    }

    /// @notice O(1) check whether a hash has been submitted by a user
    /// @param user Address of the user
    /// @param hash The commitment to verify
    function verifyProof(address user, bytes32 hash) external view returns (bool) {
        return _exists[user][hash];
    }
}
