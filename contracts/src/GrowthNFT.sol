// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MetadataRenderer.sol";

/// @title GrowthNFT
/// @notice Soulbound dynamic NFT that evolves as the user grows.
///         One NFT per address. Stats updated exclusively by the trusted oracle.
///         Metadata URIs are resolved via MetadataRenderer for deterministic IPFS links.
contract GrowthNFT is ERC721, Ownable {
    struct GrowthData {
        uint8   level;
        uint32  streakDays;
        uint32  totalLogs;
        uint256 mintedAt;
        string  metadataURI; // cached URI; refreshed on each updateGrowth call
    }

    uint256 private _nextTokenId = 1;

    mapping(address => uint256) public tokenOfOwner;
    mapping(uint256 => GrowthData) public growthData;

    address public oracle;

    /// @notice Optional MetadataRenderer — if set, URIs are resolved dynamically
    MetadataRenderer public renderer;

    event Minted(address indexed user, uint256 indexed tokenId);
    event LevelUp(uint256 indexed tokenId, uint8 newLevel);
    event MetadataUpdated(uint256 indexed tokenId, string uri);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event RendererUpdated(address indexed renderer);

    modifier onlyOracle() {
        require(msg.sender == oracle, "Not oracle");
        _;
    }

    constructor(address _oracle) ERC721("VitraMind Growth", "VMGROW") Ownable(msg.sender) {
        require(_oracle != address(0), "Zero oracle");
        oracle = _oracle;
    }

    // ── Core ──────────────────────────────────────────────────────────────────

    /// @notice Mint a growth NFT for a user (one per address, oracle only)
    function mint(address user, string calldata metadataURI) external onlyOracle {
        require(user != address(0), "Zero address");
        require(tokenOfOwner[user] == 0, "Already minted");
        uint256 tokenId = _nextTokenId++;
        _safeMint(user, tokenId);
        tokenOfOwner[user] = tokenId;
        growthData[tokenId] = GrowthData(1, 0, 0, block.timestamp, metadataURI);
        emit Minted(user, tokenId);
    }

    /// @notice Update growth stats; emits LevelUp if level increases
    function updateGrowth(
        address user,
        uint8   newLevel,
        uint32  streakDays,
        uint32  totalLogs,
        string calldata metadataURI
    ) external onlyOracle {
        uint256 tokenId = tokenOfOwner[user];
        require(tokenId != 0, "No NFT");
        require(newLevel >= 1, "Invalid level");
        GrowthData storage d = growthData[tokenId];
        if (newLevel > d.level) emit LevelUp(tokenId, newLevel);
        d.level       = newLevel;
        d.streakDays  = streakDays;
        d.totalLogs   = totalLogs;

        // If renderer is set, resolve URI dynamically; otherwise use provided URI
        string memory uri = address(renderer) != address(0)
            ? renderer.tokenURI(newLevel, tokenId)
            : metadataURI;

        d.metadataURI = uri;
        emit MetadataUpdated(tokenId, uri);
    }

    // ── Soulbound enforcement ──────────────────────────────────────────────────

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(from == address(0), "Soulbound: non-transferable");
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(from == address(0), "Soulbound: non-transferable");
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function approve(address, uint256) public pure override {
        revert("Soulbound: approvals disabled");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: approvals disabled");
    }

    // ── Metadata ──────────────────────────────────────────────────────────────

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // reverts with ERC721NonexistentToken if not minted
        GrowthData storage d = growthData[tokenId];
        if (address(renderer) != address(0)) {
            return renderer.tokenURI(d.level, tokenId);
        }
        return d.metadataURI;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Zero oracle");
        emit OracleUpdated(oracle, _oracle);
        oracle = _oracle;
    }

    /// @notice Attach or detach a MetadataRenderer (pass address(0) to detach)
    function setRenderer(address _renderer) external onlyOwner {
        renderer = MetadataRenderer(_renderer);
        emit RendererUpdated(_renderer);
    }
}
