// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title GrowthIdentity
/// @notice Cross-app composable growth identity layer.
///         Users publish a signed identity commitment that third-party apps can read
///         to verify growth credentials without accessing raw data.
///
/// @dev    Identity structure (all off-chain, only commitment on-chain):
///           - profileHash    from ProfileAnchor
///           - growthLevel    from GrowthNFT
///           - streakProofs   from StreakVerifier / ZKStreakVerifier
///           - achievementSet from RewardsEngine badges
///
///         The commitment is keccak256(abi.encode(profileHash, level, streakRoot, badgeRoot, salt))
///         Third-party apps call verifyIdentity() to confirm a user holds a valid identity.
///
///         Authorized apps are registered by the owner. Each app gets a unique appId.
contract GrowthIdentity is Ownable {
    struct Identity {
        bytes32 commitment;   // keccak256 of the identity bundle
        uint8   growthLevel;  // snapshot of level at time of publish
        uint256 publishedAt;
        bool    active;       // user can deactivate their identity
    }

    struct AppRegistration {
        string  name;
        address appAddress;
        bool    active;
    }

    mapping(address => Identity) public identities;

    /// @dev appId => registration
    mapping(uint256 => AppRegistration) public apps;
    uint256 public appCount;

    /// @dev appId => user => has verified
    mapping(uint256 => mapping(address => bool)) public appVerifications;

    event IdentityPublished(address indexed user, bytes32 indexed commitment, uint8 growthLevel);
    event IdentityDeactivated(address indexed user);
    event AppRegistered(uint256 indexed appId, string name, address appAddress);
    event AppVerified(uint256 indexed appId, address indexed user);

    constructor() Ownable(msg.sender) {}

    // ── User actions ──────────────────────────────────────────────────────────

    /// @notice Publish or update a growth identity commitment
    /// @param commitment  keccak256(abi.encode(profileHash, level, streakRoot, badgeRoot, salt))
    /// @param growthLevel Current growth level snapshot (1–100)
    function publishIdentity(bytes32 commitment, uint8 growthLevel) external {
        require(commitment != bytes32(0), "Invalid commitment");
        require(growthLevel >= 1,         "Invalid level");
        identities[msg.sender] = Identity(commitment, growthLevel, block.timestamp, true);
        emit IdentityPublished(msg.sender, commitment, growthLevel);
    }

    /// @notice Deactivate the caller's identity (opt-out)
    function deactivateIdentity() external {
        require(identities[msg.sender].commitment != bytes32(0), "No identity");
        require(identities[msg.sender].active, "Already inactive");
        identities[msg.sender].active = false;
        emit IdentityDeactivated(msg.sender);
    }

    /// @notice Returns true if a user has an active identity
    function hasActiveIdentity(address user) external view returns (bool) {
        return identities[user].active && identities[user].commitment != bytes32(0);
    }

    // ── App registry ──────────────────────────────────────────────────────────

    /// @notice Register a third-party app that can consume growth identities
    function registerApp(string calldata name, address appAddress) external onlyOwner returns (uint256 appId) {
        require(bytes(name).length > 0,   "Empty name");
        require(appAddress != address(0), "Zero address");
        appId = appCount++;
        apps[appId] = AppRegistration(name, appAddress, true);
        emit AppRegistered(appId, name, appAddress);
    }

    /// @notice Record that an app has verified a user's identity
    /// @dev    Called by the registered app contract or owner on behalf of the app
    function recordVerification(uint256 appId, address user) external {
        AppRegistration storage app = apps[appId];
        require(app.active,                    "App not active");
        require(msg.sender == app.appAddress || msg.sender == owner(), "Unauthorized");
        require(identities[user].active,       "No active identity");
        appVerifications[appId][user] = true;
        emit AppVerified(appId, user);
    }
}
