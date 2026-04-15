// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title WellnessProtocol
/// @notice Registry for composable wellness protocols.
///         Third-party developers register protocols that define habit/goal schemas.
///         Users opt into protocols; their progress is tracked as commitment hashes.
///
/// @dev    A "protocol" is an off-chain specification (JSON schema pinned to IPFS)
///         describing a wellness program (e.g. "30-day meditation", "sleep hygiene").
///         On-chain we store: protocol metadata, user opt-ins, and progress commitments.
///         Raw progress data stays off-chain — only hashes are anchored here.
contract WellnessProtocol is Ownable {
    struct Protocol {
        string  name;
        string  schemaCID;   // IPFS CID of the JSON schema defining the protocol
        address creator;
        bool    active;
        uint256 createdAt;
    }

    struct UserProgress {
        bytes32 commitmentHash; // keccak256 of off-chain progress data
        uint256 updatedAt;
    }

    uint256 public protocolCount;

    mapping(uint256 => Protocol) public protocols;

    /// @dev protocolId => user => opted in
    mapping(uint256 => mapping(address => bool)) public optedIn;

    /// @dev protocolId => user => latest progress commitment
    mapping(uint256 => mapping(address => UserProgress)) public progress;

    event ProtocolRegistered(uint256 indexed protocolId, string name, address indexed creator);
    event ProtocolDeactivated(uint256 indexed protocolId);
    event UserOptedIn(uint256 indexed protocolId, address indexed user);
    event UserOptedOut(uint256 indexed protocolId, address indexed user);
    event ProgressCommitted(uint256 indexed protocolId, address indexed user, bytes32 commitmentHash);

    constructor() Ownable(msg.sender) {}

    // ── Protocol management ───────────────────────────────────────────────────

    /// @notice Register a new wellness protocol
    /// @param name      Human-readable protocol name (e.g. "30-Day Meditation")
    /// @param schemaCID IPFS CID of the JSON schema defining habits, goals, and check-in format
    function registerProtocol(string calldata name, string calldata schemaCID)
        external returns (uint256 protocolId)
    {
        require(bytes(name).length > 0,      "Empty name");
        require(bytes(schemaCID).length > 0, "Empty CID");
        protocolId = protocolCount++;
        protocols[protocolId] = Protocol(name, schemaCID, msg.sender, true, block.timestamp);
        emit ProtocolRegistered(protocolId, name, msg.sender);
    }

    /// @notice Deactivate a protocol (creator or owner only)
    function deactivateProtocol(uint256 protocolId) external {
        Protocol storage p = protocols[protocolId];
        require(p.creator != address(0),                          "Unknown protocol");
        require(msg.sender == p.creator || msg.sender == owner(), "Unauthorized");
        p.active = false;
        emit ProtocolDeactivated(protocolId);
    }

    // ── User participation ────────────────────────────────────────────────────

    /// @notice Opt into a wellness protocol
    function optIn(uint256 protocolId) external {
        require(protocols[protocolId].active, "Protocol inactive");
        require(!optedIn[protocolId][msg.sender], "Already opted in");
        optedIn[protocolId][msg.sender] = true;
        emit UserOptedIn(protocolId, msg.sender);
    }

    /// @notice Opt out of a wellness protocol
    function optOut(uint256 protocolId) external {
        require(optedIn[protocolId][msg.sender], "Not opted in");
        optedIn[protocolId][msg.sender] = false;
        emit UserOptedOut(protocolId, msg.sender);
    }

    /// @notice Commit a progress hash for a protocol
    /// @param protocolId     Protocol identifier
    /// @param commitmentHash keccak256 of the off-chain progress data
    function commitProgress(uint256 protocolId, bytes32 commitmentHash) external {
        require(optedIn[protocolId][msg.sender],  "Not opted in");
        require(protocols[protocolId].active,     "Protocol inactive");
        require(commitmentHash != bytes32(0),     "Invalid hash");
        progress[protocolId][msg.sender] = UserProgress(commitmentHash, block.timestamp);
        emit ProgressCommitted(protocolId, msg.sender, commitmentHash);
    }
}
