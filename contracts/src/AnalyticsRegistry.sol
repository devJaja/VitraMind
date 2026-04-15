// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title AnalyticsRegistry
/// @notice Privacy-preserving on-chain analytics layer.
///         Stores aggregated habit/mood statistics as hashed snapshots — no raw data.
///         The oracle pushes weekly/monthly digest hashes; the frontend reads them
///         to verify dashboard data integrity.
/// @dev    period 0 = weekly, period 1 = monthly.
///         _latestIndex tracks the most recent snapshot per period for O(1) lookup.
contract AnalyticsRegistry {
    struct Snapshot {
        bytes32 digestHash;  // keccak256 of the off-chain analytics JSON
        uint8   period;      // 0 = weekly, 1 = monthly
        uint256 timestamp;
    }

    address public oracle;

    /// @dev user => snapshots
    mapping(address => Snapshot[]) private _snapshots;

    /// @dev user => period => latest snapshot index + 1 (0 means none)
    mapping(address => mapping(uint8 => uint256)) private _latestIndex;

    event SnapshotAnchored(
        address indexed user,
        bytes32 indexed digestHash,
        uint8   period,
        uint256 timestamp
    );
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    modifier onlyOracle() {
        require(msg.sender == oracle, "Not oracle");
        _;
    }

    constructor(address _oracle) {
        require(_oracle != address(0), "Zero oracle");
        oracle = _oracle;
    }

    /// @notice Anchor an analytics digest for a user
    /// @param user       User address
    /// @param digestHash keccak256 of the analytics JSON (mood trends, habit rates, etc.)
    /// @param period     0 = weekly, 1 = monthly
    function anchorSnapshot(address user, bytes32 digestHash, uint8 period) external onlyOracle {
        require(user       != address(0), "Zero address");
        require(digestHash != bytes32(0), "Invalid hash");
        require(period <= 1,              "Invalid period");
        uint256 idx = _snapshots[user].length;
        _snapshots[user].push(Snapshot(digestHash, period, block.timestamp));
        _latestIndex[user][period] = idx + 1;
        emit SnapshotAnchored(user, digestHash, period, block.timestamp);
    }

    /// @notice Returns the latest snapshot for a given period
    function latestSnapshot(address user, uint8 period) external view returns (Snapshot memory) {
        uint256 idx = _latestIndex[user][period];
        require(idx > 0, "No snapshot");
        return _snapshots[user][idx - 1];
    }

    /// @notice Returns total snapshot count for a user
    function snapshotCount(address user) external view returns (uint256) {
        return _snapshots[user].length;
    }

    /// @notice Fetch a snapshot by index
    function getSnapshot(address user, uint256 index) external view returns (Snapshot memory) {
        require(index < _snapshots[user].length, "Out of bounds");
        return _snapshots[user][index];
    }

    /// @notice Update the oracle address (only current oracle can rotate)
    function setOracle(address _oracle) external onlyOracle {
        require(_oracle != address(0), "Zero oracle");
        emit OracleUpdated(oracle, _oracle);
        oracle = _oracle;
    }
}
