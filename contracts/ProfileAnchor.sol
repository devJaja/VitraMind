// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title ProfileAnchor
/// @notice Stores a cryptographic identity anchor per user.
contract ProfileAnchor {
    mapping(address => bytes32) public profileHash;

    event ProfileAnchored(address indexed user, bytes32 indexed hash, uint256 timestamp);

    function anchorProfile(bytes32 hash) external {
        require(hash != bytes32(0), "Invalid hash");
        profileHash[msg.sender] = hash;
        emit ProfileAnchored(msg.sender, hash, block.timestamp);
    }
}
