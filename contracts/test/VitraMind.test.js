const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("ProfileAnchor", () => {
  let contract, user, other;

  beforeEach(async () => {
    [, user, other] = await ethers.getSigners();
    contract = await ethers.deployContract("ProfileAnchor");
  });

  it("anchors a profile hash", async () => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("profile-data"));
    await contract.connect(user).anchorProfile(hash);
    expect(await contract.profileHash(user.address)).to.equal(hash);
    expect(await contract.hasProfile(user.address)).to.be.true;
  });

  it("allows updating the hash", async () => {
    const h1 = ethers.keccak256(ethers.toUtf8Bytes("v1"));
    const h2 = ethers.keccak256(ethers.toUtf8Bytes("v2"));
    await contract.connect(user).anchorProfile(h1);
    await contract.connect(user).anchorProfile(h2);
    expect(await contract.profileHash(user.address)).to.equal(h2);
  });

  it("reverts on zero hash", async () => {
    await expect(contract.connect(user).anchorProfile(ethers.ZeroHash))
      .to.be.revertedWith("Invalid hash");
  });

  it("returns false for user with no profile", async () => {
    expect(await contract.hasProfile(other.address)).to.be.false;
  });
});

describe("ProofRegistry", () => {
  let contract, user;
  const ProofType = { LOG: 0, INSIGHT: 1, STREAK: 2, ACHIEVEMENT: 3 };

  beforeEach(async () => {
    [, user] = await ethers.getSigners();
    contract = await ethers.deployContract("ProofRegistry");
  });

  it("submits a proof and verifies it", async () => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("log-1"));
    await contract.connect(user).submitProof(hash, ProofType.LOG);
    expect(await contract.proofCount(user.address)).to.equal(1);
    expect(await contract.verifyProof(user.address, hash)).to.be.true;
  });

  it("stores correct proof type", async () => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("insight-1"));
    await contract.connect(user).submitProof(hash, ProofType.INSIGHT);
    const proof = await contract.getProof(user.address, 0);
    expect(proof.proofType).to.equal(ProofType.INSIGHT);
  });

  it("rejects duplicate proofs", async () => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("dup"));
    await contract.connect(user).submitProof(hash, ProofType.LOG);
    await expect(contract.connect(user).submitProof(hash, ProofType.LOG))
      .to.be.revertedWith("Duplicate proof");
  });

  it("reverts on zero hash", async () => {
    await expect(contract.connect(user).submitProof(ethers.ZeroHash, ProofType.LOG))
      .to.be.revertedWith("Invalid hash");
  });

  it("reverts getProof out of bounds", async () => {
    await expect(contract.getProof(user.address, 0)).to.be.revertedWith("Out of bounds");
  });

  it("returns false for unknown hash", async () => {
    expect(await contract.verifyProof(user.address, ethers.keccak256(ethers.toUtf8Bytes("x"))))
      .to.be.false;
  });
});

describe("GrowthNFT", () => {
  let contract, owner, oracle, user, other;

  beforeEach(async () => {
    [owner, oracle, user, other] = await ethers.getSigners();
    contract = await ethers.deployContract("GrowthNFT", [oracle.address]);
  });

  it("mints NFT with initial growth data", async () => {
    await contract.connect(oracle).mint(user.address, "ipfs://initial");
    expect(await contract.ownerOf(1)).to.equal(user.address);
    const d = await contract.growthData(1);
    expect(d.level).to.equal(1);
    expect(d.metadataURI).to.equal("ipfs://initial");
  });

  it("prevents double minting", async () => {
    await contract.connect(oracle).mint(user.address, "ipfs://a");
    await expect(contract.connect(oracle).mint(user.address, "ipfs://b"))
      .to.be.revertedWith("Already minted");
  });

  it("updates growth and emits LevelUp", async () => {
    await contract.connect(oracle).mint(user.address, "ipfs://v1");
    await expect(contract.connect(oracle).updateGrowth(user.address, 5, 30, 50, "ipfs://v2"))
      .to.emit(contract, "LevelUp").withArgs(1, 5);
    expect((await contract.growthData(1)).level).to.equal(5);
  });

  it("does not emit LevelUp when level unchanged", async () => {
    await contract.connect(oracle).mint(user.address, "ipfs://v1");
    const tx = await contract.connect(oracle).updateGrowth(user.address, 1, 5, 5, "ipfs://v2");
    const receipt = await tx.wait();
    const levelUpEvents = receipt.logs.filter(l => l.fragment?.name === "LevelUp");
    expect(levelUpEvents.length).to.equal(0);
  });

  it("blocks transfer (soulbound)", async () => {
    await contract.connect(oracle).mint(user.address, "ipfs://v1");
    await expect(contract.connect(user).transferFrom(user.address, other.address, 1))
      .to.be.revertedWith("Soulbound: non-transferable");
  });

  it("blocks safeTransferFrom (soulbound)", async () => {
    await contract.connect(oracle).mint(user.address, "ipfs://v1");
    await expect(
      contract.connect(user)["safeTransferFrom(address,address,uint256)"](user.address, other.address, 1)
    ).to.be.revertedWith("Soulbound: non-transferable");
  });

  it("blocks approve (soulbound)", async () => {
    await contract.connect(oracle).mint(user.address, "ipfs://v1");
    await expect(contract.connect(user).approve(other.address, 1))
      .to.be.revertedWith("Soulbound: approvals disabled");
  });

  it("blocks setApprovalForAll (soulbound)", async () => {
    await expect(contract.connect(user).setApprovalForAll(other.address, true))
      .to.be.revertedWith("Soulbound: approvals disabled");
  });

  it("only oracle can mint", async () => {
    await expect(contract.connect(other).mint(user.address, "ipfs://x"))
      .to.be.revertedWith("Not oracle");
  });

  it("owner can update oracle", async () => {
    await expect(contract.connect(owner).setOracle(other.address))
      .to.emit(contract, "OracleUpdated").withArgs(oracle.address, other.address);
  });
});

describe("RewardsEngine", () => {
  let contract, mockCUSD, owner, oracle, user, other;
  const ONE = ethers.parseEther("1");

  beforeEach(async () => {
    [owner, oracle, user, other] = await ethers.getSigners();
    mockCUSD = await ethers.deployContract("MockCUSD");
    contract = await ethers.deployContract("RewardsEngine", [
      await mockCUSD.getAddress(),
      oracle.address,
    ]);
  });

  it("awards points", async () => {
    await expect(contract.connect(oracle).awardPoints(user.address, 100, "7-day streak"))
      .to.emit(contract, "PointsAwarded").withArgs(user.address, 100, "7-day streak");
    expect((await contract.rewards(user.address)).points).to.equal(100);
  });

  it("accumulates points across calls", async () => {
    await contract.connect(oracle).awardPoints(user.address, 50, "a");
    await contract.connect(oracle).awardPoints(user.address, 75, "b");
    expect((await contract.rewards(user.address)).points).to.equal(125);
  });

  it("awards badge and is idempotent", async () => {
    await expect(contract.connect(oracle).awardBadge(user.address, 1))
      .to.emit(contract, "BadgeEarned").withArgs(user.address, 1);
    await expect(contract.connect(oracle).awardBadge(user.address, 1))
      .to.not.emit(contract, "BadgeEarned");
    expect(await contract.badges(1, user.address)).to.be.true;
  });

  it("distributes cUSD reward", async () => {
    await mockCUSD.mint(owner.address, ONE * 10n);
    await mockCUSD.connect(owner).approve(await contract.getAddress(), ONE * 10n);
    await contract.connect(owner).deposit(ONE * 5n);
    await expect(contract.connect(oracle).rewardCUSD(user.address, ONE))
      .to.emit(contract, "CUSDRewarded").withArgs(user.address, ONE);
    expect(await mockCUSD.balanceOf(user.address)).to.equal(ONE);
  });

  it("reverts rewardCUSD when underfunded", async () => {
    await expect(contract.connect(oracle).rewardCUSD(user.address, ONE))
      .to.be.revertedWith("Insufficient funds");
  });

  it("only oracle can award points", async () => {
    await expect(contract.connect(other).awardPoints(user.address, 10, "x"))
      .to.be.revertedWith("Not oracle");
  });

  it("reverts awardPoints with zero amount", async () => {
    await expect(contract.connect(oracle).awardPoints(user.address, 0, "x"))
      .to.be.revertedWith("Zero points");
  });

  it("owner can update oracle", async () => {
    await expect(contract.connect(owner).setOracle(other.address))
      .to.emit(contract, "OracleUpdated").withArgs(oracle.address, other.address);
  });

  it("reverts constructor with zero cUSD address", async () => {
    await expect(
      ethers.deployContract("RewardsEngine", [ethers.ZeroAddress, oracle.address])
    ).to.be.revertedWith("Zero cUSD");
  });
});
