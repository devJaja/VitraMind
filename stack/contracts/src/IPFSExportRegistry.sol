// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title IPFSExportRegistry
/// @notice Anchors encrypted IPFS export CIDs on-chain so users can prove
///         they exported their data at a specific point in time.
///
/// @dev    The actual data is encrypted client-side (AES-256-GCM) before being
///         pinned to IPFS. Only the CID and a keccak256 content hash are stored here.
///         The encryption key never touches the chain.
///
///         Export types:
///           0 = FULL      — complete journal + analytics export
///           1 = LOGS      — daily logs only
///           2 = INSIGHTS  — AI insights only
///           3 = ANALYTICS — aggregated analytics only
contract IPFSExportRegistry {
    enum ExportType { FULL, LOGS, INSIGHTS, ANALYTICS }

    struct ExportRecord {
        string     cid;          // IPFS CID of the encrypted export
        bytes32    contentHash;  // keccak256 of the plaintext before encryption
        ExportType exportType;
        uint256    timestamp;
    }

    /// @dev user => export history
    mapping(address => ExportRecord[]) private _exports;

    /// @dev user => contentHash => exists — O(1) verification, no loop
    mapping(address => mapping(bytes32 => bool)) private _hashExists;

    event ExportAnchored(
        address indexed user,
        string  cid,
        bytes32 indexed contentHash,
        ExportType exportType,
        uint256 timestamp
    );

    /// @notice Anchor an encrypted IPFS export record
    /// @param cid         IPFS CID of the encrypted export bundle (e.g. "QmXxx...")
    /// @param contentHash keccak256 of the plaintext data before encryption — used for integrity checks
    /// @param exportType  Category of export (FULL / LOGS / INSIGHTS / ANALYTICS)
    function anchorExport(
        string calldata cid,
        bytes32         contentHash,
        ExportType      exportType
    ) external {
        require(bytes(cid).length > 0,     "Empty CID");
        require(contentHash != bytes32(0), "Invalid hash");
        _exports[msg.sender].push(ExportRecord(cid, contentHash, exportType, block.timestamp));
        _hashExists[msg.sender][contentHash] = true;
        emit ExportAnchored(msg.sender, cid, contentHash, exportType, block.timestamp);
    }

    /// @notice Returns the number of exports anchored by a user
    function exportCount(address user) external view returns (uint256) {
        return _exports[user].length;
    }

    /// @notice Fetch an export record by index
    function getExport(address user, uint256 index) external view returns (ExportRecord memory) {
        require(index < _exports[user].length, "Out of bounds");
        return _exports[user][index];
    }

    /// @notice Returns the latest export record for a user
    function latestExport(address user) external view returns (ExportRecord memory) {
        uint256 len = _exports[user].length;
        require(len > 0, "No exports");
        return _exports[user][len - 1];
    }

    /// @notice O(1) check whether a contentHash has been anchored by a user
    function verifyExport(address user, bytes32 contentHash) external view returns (bool) {
        return _hashExists[user][contentHash];
    }
}
