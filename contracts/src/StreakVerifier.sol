// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title StreakVerifier
/// @notice Anchors habit streak proofs on-chain with cooldown enforcement.
///         Oracle submits a streak proof once per day per user; contract enforces
///         the 24-hour window so streaks cannot be double-counted.
/// @dev    Streak continuity is verified off-chain by the oracle. This contract
///         only enforces submission rate and stores the commitment.
contract StreakVerifier {
    struct StreakEntry {
        bytes32 proofHash;   // keccak256(userId + date + habitIds)
        uint32  streakCount; // cumulative streak days at time of submission
        uint256 submittedAt;
    }

    address public oracle;

    /// @dev user => streak history
    mapping(address => StreakEntry[]) private _streaks;

    /// @dev user => timestamp of last streak submission (cooldown enforcement)
    mapping(address => uint256) public lastStreakAt;

    /// @dev Minimum seconds between streak submissions (23h to allow slight clock drift)
    uint256 public constant COOLDOWN = 23 hours;

    event StreakAnchored(
        address indexed user,
        bytes32 indexed proofHash,
        uint32  streakCount,
        uint256 timestamp
    );

    modifier onlyOracle() {
        require(msg.sender == oracle, "Not oracle");
        _;
    }

    constructor(address _oracle) {
        require(_oracle != address(0), "Zero oracle");
        oracle = _oracle;
    }

    /// @notice Anchor a daily streak proof for a user
    /// @param user          User address
    /// @param proofHash     keccak256 commitment of the streak data
    /// @param currentStreak Cumulative streak day count
    function anchorStreak(address user, bytes32 proofHash, uint32 currentStreak) external onlyOracle {
        require(user      != address(0),  "Zero address");
        require(proofHash != bytes32(0),  "Invalid hash");
        require(currentStreak > 0,        "Zero streak");
        require(
            block.timestamp >= lastStreakAt[user] + COOLDOWN,
            "Cooldown active"
        );
        lastStreakAt[user] = block.timestamp;
        _streaks[user].push(StreakEntry(proofHash, currentStreak, block.timestamp));
        emit StreakAnchored(user, proofHash, currentStreak, block.timestamp);
    }

    /// @notice Returns the current streak entry count for a user
    function streakCount(address user) external view returns (uint256) {
        return _streaks[user].length;
    }

    /// @notice Returns the latest streak entry for a user
    function latestStreak(address user) external view returns (StreakEntry memory) {
        uint256 len = _streaks[user].length;
        require(len > 0, "No streaks");
        return _streaks[user][len - 1];
    }

    /// @notice Fetch a streak entry by index
    function getStreak(address user, uint256 index) external view returns (StreakEntry memory) {
        require(index < _streaks[user].length, "Out of bounds");
        return _streaks[user][index];
    }
}
