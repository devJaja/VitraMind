// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title IGrowthNFT
/// @notice Interface for GrowthNFT — enables oracle to mint and update growth data
interface IGrowthNFT {
    function mint(address user, string calldata metadataURI) external;
    function updateGrowth(address user, uint8 newLevel, uint32 streakDays, uint32 totalLogs, string calldata metadataURI) external;
    function tokenOfOwner(address user) external view returns (uint256);
}
