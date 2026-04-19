// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "../interfaces/IGroth16Verifier.sol";

/// @dev Mock Groth16 verifier for testing ZKStreakVerifier.
///      Returns true for all proofs unless explicitly set to reject.
contract MockGroth16Verifier is IGroth16Verifier {
    bool public shouldReject;

    function setShouldReject(bool _reject) external {
        shouldReject = _reject;
    }

    function verifyProof(
        uint256[2]    calldata,
        uint256[2][2] calldata,
        uint256[2]    calldata,
        uint256[]     calldata
    ) external view override returns (bool) {
        return !shouldReject;
    }
}
