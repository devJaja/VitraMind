// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title IRewardsEngine
/// @notice Interface for RewardsEngine — enables oracle and other contracts to trigger rewards
interface IRewardsEngine {
    function rewardCUSD(address user, uint256 amount) external;
    function rewardStreak(address user, uint32 streakDays) external;
    function awardPoints(address user, uint256 points, string calldata reason) external;
    function awardBadge(address user, uint256 badgeId) external;
}
