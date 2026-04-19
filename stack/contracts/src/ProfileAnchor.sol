// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title ProfileAnchor
/// @notice Stores a cryptographic identity anchor per user. Raw data never touches chain.
/// @dev    Users call anchorProfile() with a keccak256 hash of their off-chain profile blob.
///         The contract only stores the commitment — no PII ever on-chain.
contract ProfileAnchor {
    /// @notice The latest profile hash for each user
    mapping(address => bytes32) public profileHash;

    /// @notice Timestamp of the last profile update per user
    mapping(address => uint256) public updatedAt;

    /// @notice Emitted whenever a user anchors or updates their profile hash
    /// @param user      The address that anchored the profile
    /// @param hash      The keccak256 commitment
    /// @param timestamp Block timestamp of the anchor
    event ProfileAnchored(address indexed user, bytes32 indexed hash, uint256 timestamp);

    /// @notice Anchor or update the caller's profile commitment
    /// @param hash keccak256 of the off-chain profile data
    function anchorProfile(bytes32 hash) external {
        require(hash != bytes32(0), "Invalid hash");
        profileHash[msg.sender] = hash;
        updatedAt[msg.sender] = block.timestamp;
        emit ProfileAnchored(msg.sender, hash, block.timestamp);
    }

    /// @notice Returns true if the user has ever anchored a profile
    /// @param user Address to check
    function hasProfile(address user) external view returns (bool) {
        return profileHash[user] != bytes32(0);
    }
}
