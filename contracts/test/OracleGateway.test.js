const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("OracleGateway", function () {
  let gateway, proofRegistry, rewardsEngine, growthNFT, metadataRenderer;
  let owner, oracle, user;

  beforeEach(async function () {
    [owner, oracle, user] = await ethers.getSigners();

    const MockCUSD = await ethers.deployContract("MockCUSD");
    metadataRenderer = await ethers.deployContract("MetadataRenderer");
    proofRegistry    = await ethers.deployContract("ProofRegistry");
    growthNFT        = await ethers.deployContract("GrowthNFT", [oracle.address]);
    rewardsEngine    = await ethers.deployContract("RewardsEngine", [await MockCUSD.getAddress(), oracle.address]);

    gateway = await ethers.deployContract("OracleGateway", [
      oracle.address,
      await proofRegistry.getAddress(),
      await rewardsEngine.getAddress(),
      await growthNFT.getAddress(),
    ]);

    // Grant gateway oracle role on GrowthNFT
    await growthNFT.connect(owner).setOracle(await gateway.getAddress());
  });

  it("deploys with correct oracle", async function () {
    expect(await gateway.oracle()).to.equal(oracle.address);
  });

  it("reverts processGrowth from non-oracle", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    await expect(
      gateway.connect(user).processGrowth(user.address, hash, 0, 1, 1, 1, "ipfs://test", false)
    ).to.be.revertedWith("Not oracle");
  });

  it("owner can update oracle", async function () {
    await gateway.connect(owner).setOracle(user.address);
    expect(await gateway.oracle()).to.equal(user.address);
  });

  it("reverts setOracle from non-owner", async function () {
    await expect(gateway.connect(oracle).setOracle(user.address)).to.be.revertedWith("Not owner");
  });
});
