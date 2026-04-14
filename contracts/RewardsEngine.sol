// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title RewardsEngine
/// @notice Distributes cUSD rewards and tracks points/badges for streaks & achievements.
///         Oracle (Serverpod backend) triggers payouts after verifying off-chain proofs.
contract RewardsEngine is Ownable {
    using SafeERC20 for IERC20;

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
    event CUSDRewarded(address indexed user, uint256 amount);
    event BadgeEarned(address indexed user, uint256 indexed badgeId);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

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

    function rewardCUSD(address user, uint256 amount) external onlyOracle {
        require(user   != address(0), "Zero address");
        require(amount  > 0,          "Zero amount");
        require(cUSD.balanceOf(address(this)) >= amount, "Insufficient funds");
        rewards[user].claimedCUSD  += amount;
        rewards[user].lastRewardAt  = block.timestamp;
        cUSD.safeTransfer(user, amount);
        emit CUSDRewarded(user, amount);
    }

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

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Zero oracle");
        emit OracleUpdated(oracle, _oracle);
        oracle = _oracle;
    }
}
