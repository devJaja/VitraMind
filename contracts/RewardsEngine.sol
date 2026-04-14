// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title RewardsEngine
/// @notice Distributes cUSD rewards and tracks points/badges for streaks & achievements.
contract RewardsEngine is Ownable {
    IERC20 public immutable cUSD;
    address public oracle;

    struct UserRewards {
        uint256 points;
        uint256 claimedCUSD;
        uint256 lastRewardAt;
    }

    mapping(address => UserRewards) public rewards;
    mapping(uint256 => mapping(address => bool)) public badges;

    event PointsAwarded(address indexed user, uint256 points, string reason);
    event BadgeEarned(address indexed user, uint256 indexed badgeId);

    modifier onlyOracle() {
        require(msg.sender == oracle, "Not oracle");
        _;
    }

    constructor(address _cUSD, address _oracle) Ownable(msg.sender) {
        require(_cUSD   != address(0), "Zero cUSD");
        require(_oracle != address(0), "Zero oracle");
        cUSD   = IERC20(_cUSD);
        oracle = _oracle;
    }

    function awardPoints(address user, uint256 points, string calldata reason) external onlyOracle {
        require(user   != address(0), "Zero address");
        require(points  > 0,          "Zero points");
        rewards[user].points += points;
        emit PointsAwarded(user, points, reason);
    }

    function awardBadge(address user, uint256 badgeId) external onlyOracle {
        require(user != address(0), "Zero address");
        if (!badges[badgeId][user]) {
            badges[badgeId][user] = true;
            emit BadgeEarned(user, badgeId);
        }
    }
}
