// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MetadataRenderer
/// @notice Builds deterministic IPFS metadata URIs for GrowthNFT based on level tiers.
///         The oracle pins the actual JSON to IPFS; this contract maps level → CID.
/// @dev    Levels 1-10 = Seedling, 11-25 = Sprout, 26-50 = Bloom, 51-75 = Flourish, 76-100 = Transcendent
contract MetadataRenderer is Ownable {
    using Strings for uint256;

    /// @notice Growth tier thresholds
    uint8 public constant TIER_SPROUT      = 11;
    uint8 public constant TIER_BLOOM       = 26;
    uint8 public constant TIER_FLOURISH    = 51;
    uint8 public constant TIER_TRANSCENDENT = 76;

    /// @notice IPFS base CIDs per tier — set by owner after pinning
    mapping(uint8 => string) public tierCID;

    event TierCIDUpdated(uint8 indexed tier, string cid);

    constructor() Ownable(msg.sender) {}

    /// @notice Set the IPFS CID for a given tier base level
    /// @param tier  One of: 1, 11, 26, 51, 76
    /// @param cid   IPFS CID string (e.g. "QmXxx...")
    function setTierCID(uint8 tier, string calldata cid) external onlyOwner {
        require(bytes(cid).length > 0, "Empty CID");
        tierCID[tier] = cid;
        emit TierCIDUpdated(tier, cid);
    }

    /// @notice Returns the metadata URI for a given level
    /// @param level  User's current growth level (1–100)
    /// @param tokenId NFT token ID (appended to URI for uniqueness)
    function tokenURI(uint8 level, uint256 tokenId) external view returns (string memory) {
        uint8 tier = _tierFor(level);
        string memory cid = tierCID[tier];
        require(bytes(cid).length > 0, "CID not set for tier");
        // ipfs://<CID>/<tokenId>.json
        return string(abi.encodePacked("ipfs://", cid, "/", tokenId.toString(), ".json"));
    }

    /// @notice Returns the tier base level for a given growth level
    function tierFor(uint8 level) external pure returns (uint8) {
        return _tierFor(level);
    }

    function _tierFor(uint8 level) internal pure returns (uint8) {
        if (level >= TIER_TRANSCENDENT) return TIER_TRANSCENDENT;
        if (level >= TIER_FLOURISH)     return TIER_FLOURISH;
        if (level >= TIER_BLOOM)        return TIER_BLOOM;
        if (level >= TIER_SPROUT)       return TIER_SPROUT;
        return 1;
    }
}
