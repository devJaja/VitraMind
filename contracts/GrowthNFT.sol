// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title GrowthNFT
/// @notice Dynamic NFT that evolves as the user grows. One NFT per address.
contract GrowthNFT is ERC721, Ownable {
    struct GrowthData {
        uint8   level;
        uint32  streakDays;
        uint32  totalLogs;
        uint256 mintedAt;
        string  metadataURI;
    }

    uint256 private _nextTokenId = 1;
    mapping(address => uint256) public tokenOfOwner;
    mapping(uint256 => GrowthData) public growthData;
    address public oracle;

    event Minted(address indexed user, uint256 indexed tokenId);

    modifier onlyOracle() {
        require(msg.sender == oracle, "Not oracle");
        _;
    }

    constructor(address _oracle) ERC721("VitraMind Growth", "VMGROW") Ownable(msg.sender) {
        require(_oracle != address(0), "Zero oracle");
        oracle = _oracle;
    }

    function mint(address user, string calldata metadataURI) external onlyOracle {
        require(user != address(0), "Zero address");
        require(tokenOfOwner[user] == 0, "Already minted");
        uint256 tokenId = _nextTokenId++;
        _safeMint(user, tokenId);
        tokenOfOwner[user] = tokenId;
        growthData[tokenId] = GrowthData(1, 0, 0, block.timestamp, metadataURI);
        emit Minted(user, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Nonexistent token");
        return growthData[tokenId].metadataURI;
    }
}
