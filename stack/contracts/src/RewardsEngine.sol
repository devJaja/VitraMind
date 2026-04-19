// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title RewardsEngine
/// @notice Distributes cUSD rewards and tracks points/badges for streaks & achievements.
///         Oracle triggers payouts after verifying off-chain proofs.
///         Streak milestones (7, 30, 100 days) trigger automatic tiered cUSD rewards.
contract RewardsEngine is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable cUSD;
    address public oracle;

    /// @notice Streak milestone thresholds (days)
    uint32 public constant STREAK_TIER_1 = 7;
    uint32 public constant STREAK_TIER_2 = 30;
    uint32 public constant STREAK_TIER_3 = 100;

    /// @notice cUSD reward amounts per streak tier (18 decimals)
    uint256 public streakReward1 = 0.5  ether; // 0.5  cUSD at 7-day streak
    uint256 public streakReward2 = 2    ether; // 2    cUSD at 30-day streak
    uint256 public streakReward3 = 10   ether; // 10   cUSD at 100-day streak

    struct UserRewards {
        uint256 points;
        uint256 claimedCUSD;
        uint256 lastRewardAt;
        uint32  highestStreakRewarded; // prevents re-claiming same tier
    }

    mapping(address => UserRewards) public rewards;
    mapping(uint256 => mapping(address => bool)) public badges;

    event PointsAwarded(address indexed user, uint256 points, string reason);
    event CUSDRewarded(address indexed user, uint256 amount);
    event StreakRewardPaid(address indexed user, uint32 streakDays, uint256 amount);
    event BadgeEarned(address indexed user, uint256 indexed badgeId);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event StreakRewardsUpdated(uint256 tier1, uint256 tier2, uint256 tier3);

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

    // ── Oracle actions ────────────────────────────────────────────────────────

    /// @notice Award points for a streak or achievement (no token transfer)
    function awardPoints(address user, uint256 points, string calldata reason) external onlyOracle {
        require(user   != address(0), "Zero address");
        require(points  > 0,          "Zero points");
        rewards[user].points += points;
        emit PointsAwarded(user, points, reason);
    }

    /// @notice Award a badge (idempotent)
    function awardBadge(address user, uint256 badgeId) external onlyOracle {
        require(user != address(0), "Zero address");
        if (!badges[badgeId][user]) {
            badges[badgeId][user] = true;
            emit BadgeEarned(user, badgeId);
        }
    }

    /// @notice Transfer a manual cUSD reward to a user
    function rewardCUSD(address user, uint256 amount) external onlyOracle {
        require(user   != address(0), "Zero address");
        require(amount  > 0,          "Zero amount");
        _transferReward(user, amount);
        emit CUSDRewarded(user, amount);
    }

    /// @notice Trigger streak milestone reward for all newly crossed tiers
    /// @param user       User address
    /// @param streakDays Current streak day count (verified off-chain by oracle)
    function rewardStreak(address user, uint32 streakDays) external onlyOracle {
        require(user != address(0), "Zero address");
        require(streakDays > 0,     "Zero streak");

        UserRewards storage r = rewards[user];
        uint256 amount = _streakRewardAmount(streakDays, r.highestStreakRewarded);
        require(amount > 0, "No new tier reached");

        // Record the highest streak seen so each tier is only paid once
        if (streakDays > r.highestStreakRewarded) {
            r.highestStreakRewarded = streakDays;
        }
        _transferReward(user, amount);
        emit StreakRewardPaid(user, streakDays, amount);
    }

    // ── Owner funding ─────────────────────────────────────────────────────────

    function deposit(uint256 amount) external onlyOwner {
        require(amount > 0, "Zero amount");
        cUSD.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Zero amount");
        require(cUSD.balanceOf(address(this)) >= amount, "Insufficient funds");
        cUSD.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Update streak reward amounts (owner only)
    function setStreakRewards(uint256 t1, uint256 t2, uint256 t3) external onlyOwner {
        require(t1 > 0 && t2 > t1 && t3 > t2, "Invalid tiers");
        streakReward1 = t1;
        streakReward2 = t2;
        streakReward3 = t3;
        emit StreakRewardsUpdated(t1, t2, t3);
    }

    function contractBalance() external view returns (uint256) {
        return cUSD.balanceOf(address(this));
    }

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Zero oracle");
        emit OracleUpdated(oracle, _oracle);
        oracle = _oracle;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _transferReward(address user, uint256 amount) internal {
        require(cUSD.balanceOf(address(this)) >= amount, "Insufficient funds");
        rewards[user].claimedCUSD  += amount;
        rewards[user].lastRewardAt  = block.timestamp;
        cUSD.safeTransfer(user, amount);
    }

    /// @dev Returns the cumulative reward for all tiers newly crossed between previous and current
    function _streakRewardAmount(uint32 current, uint32 previous) internal view returns (uint256) {
        uint256 amount = 0;
        if (current >= STREAK_TIER_3 && previous < STREAK_TIER_3) amount += streakReward3;
        if (current >= STREAK_TIER_2 && previous < STREAK_TIER_2) amount += streakReward2;
        if (current >= STREAK_TIER_1 && previous < STREAK_TIER_1) amount += streakReward1;
        return amount;
    }
}
