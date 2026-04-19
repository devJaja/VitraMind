// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./interfaces/IProofRegistry.sol";
import "./interfaces/IRewardsEngine.sol";
import "./interfaces/IGrowthNFT.sol";

/// @title OracleGateway
/// @notice Single entry point for the VitraMind oracle backend.
///         Batches proof submission, streak anchoring, NFT updates, and reward
///         distribution into atomic multi-step operations.
///
/// @dev    The oracle calls this contract instead of each contract individually.
///         This reduces the number of transactions and ensures atomicity.
contract OracleGateway {
    address public oracle;
    address public owner;

    IProofRegistry public proofRegistry;
    IRewardsEngine public rewardsEngine;
    IGrowthNFT     public growthNFT;

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event GrowthProcessed(address indexed user, uint32 streakDays, uint8 newLevel);

    modifier onlyOracle() { require(msg.sender == oracle, "Not oracle"); _; }
    modifier onlyOwner()  { require(msg.sender == owner,  "Not owner");  _; }

    constructor(
        address _oracle,
        address _proofRegistry,
        address _rewardsEngine,
        address _growthNFT
    ) {
        require(_oracle != address(0), "Zero oracle");
        oracle        = _oracle;
        owner         = msg.sender;
        proofRegistry = IProofRegistry(_proofRegistry);
        rewardsEngine = IRewardsEngine(_rewardsEngine);
        growthNFT     = IGrowthNFT(_growthNFT);
    }

    /// @notice Process a complete growth update in one transaction:
    ///         submit proof → update NFT → reward streak
    function processGrowth(
        address user,
        bytes32 proofHash,
        IProofRegistry.ProofType proofType,
        uint8   newLevel,
        uint32  streakDays,
        uint32  totalLogs,
        string  calldata metadataURI,
        bool    rewardStreak
    ) external onlyOracle {
        require(user != address(0), "Zero address");

        // 1. Anchor proof
        proofRegistry.submitProof(proofHash, proofType);

        // 2. Mint or update NFT
        if (growthNFT.tokenOfOwner(user) == 0) {
            growthNFT.mint(user, metadataURI);
        } else {
            growthNFT.updateGrowth(user, newLevel, streakDays, totalLogs, metadataURI);
        }

        // 3. Optionally trigger streak reward
        if (rewardStreak && streakDays > 0) {
            rewardsEngine.rewardStreak(user, streakDays);
        }

        emit GrowthProcessed(user, streakDays, newLevel);
    }

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Zero oracle");
        emit OracleUpdated(oracle, _oracle);
        oracle = _oracle;
    }
}
