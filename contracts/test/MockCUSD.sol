// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Minimal ERC20 mock for testing RewardsEngine
contract MockCUSD is ERC20 {
    constructor() ERC20("Mock cUSD", "cUSD") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
