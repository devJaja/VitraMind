const { expect } = require("chai");
const { ethers }  = require("hardhat");
const { time }    = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

// ─── StreakVerifier ───────────────────────────────────────────────────────────
describe("StreakVerifier", () => {
  let contract, oracle, user, other;

  beforeEach(async () => {
    [, oracle, user, other] = await ethers.getSigners();
    contract = await ethers.deployContract("StreakVerifier", [oracle.address]);
  });

  it("anchors a streak proof", async () => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("streak-day-1"));
    await expect(contract.connect(oracle).anchorStreak(user.address, hash, 1))
      .to.emit(contract, "StreakAnchored")
      .withArgs(user.address, hash, 1, anyValue);
    expect(await contract.streakCount(user.address)).to.equal(1);
  });

  it("returns latest streak entry", async () => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("streak-7"));
    await contract.connect(oracle).anchorStreak(user.address, hash, 7);
    const entry = await contract.latestStreak(user.address);
    expect(entry.currentStreak).to.equal(7);
    expect(entry.proofHash).to.equal(hash);
  });

  it("enforces 23h cooldown between submissions", async () => {
    const h1 = ethers.keccak256(ethers.toUtf8Bytes("day-1"));
    const h2 = ethers.keccak256(ethers.toUtf8Bytes("day-2"));
    await contract.connect(oracle).anchorStreak(user.address, h1, 1);
    await expect(contract.connect(oracle).anchorStreak(user.address, h2, 2))
      .to.be.revertedWith("Cooldown active");
  });

  it("allows submission after cooldown expires", async () => {
    const h1 = ethers.keccak256(ethers.toUtf8Bytes("day-1"));
    const h2 = ethers.keccak256(ethers.toUtf8Bytes("day-2"));
    await contract.connect(oracle).anchorStreak(user.address, h1, 1);
    await time.increase(23 * 3600 + 1);
    await expect(contract.connect(oracle).anchorStreak(user.address, h2, 2))
      .to.emit(contract, "StreakAnchored");
    expect(await contract.streakCount(user.address)).to.equal(2);
  });

  it("reverts on zero hash", async () => {
    await expect(contract.connect(oracle).anchorStreak(user.address, ethers.ZeroHash, 1))
      .to.be.revertedWith("Invalid hash");
  });

  it("reverts on zero streak", async () => {
    await expect(contract.connect(oracle).anchorStreak(user.address, ethers.keccak256(ethers.toUtf8Bytes("x")), 0))
      .to.be.revertedWith("Zero streak");
  });

  it("only oracle can anchor", async () => {
    await expect(contract.connect(other).anchorStreak(user.address, ethers.keccak256(ethers.toUtf8Bytes("x")), 1))
      .to.be.revertedWith("Not oracle");
  });

  it("reverts latestStreak with no entries", async () => {
    await expect(contract.latestStreak(user.address)).to.be.revertedWith("No streaks");
  });

  it("oracle can rotate oracle address", async () => {
    await expect(contract.connect(oracle).setOracle(other.address))
      .to.emit(contract, "OracleUpdated").withArgs(oracle.address, other.address);
    expect(await contract.oracle()).to.equal(other.address);
  });
});

// ─── MetadataRenderer ────────────────────────────────────────────────────────
describe("MetadataRenderer", () => {
  let contract, owner, other;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    contract = await ethers.deployContract("MetadataRenderer");
  });

  it("sets a tier CID and resolves tokenURI", async () => {
    await contract.connect(owner).setTierCID(1, "QmSeedling");
    const uri = await contract.tokenURI(5, 1);
    expect(uri).to.equal("ipfs://QmSeedling/1.json");
  });

  it("resolves correct tier for each level range", async () => {
    expect(await contract.tierFor(1)).to.equal(1);
    expect(await contract.tierFor(10)).to.equal(1);
    expect(await contract.tierFor(11)).to.equal(11);
    expect(await contract.tierFor(25)).to.equal(11);
    expect(await contract.tierFor(26)).to.equal(26);
    expect(await contract.tierFor(50)).to.equal(26);
    expect(await contract.tierFor(51)).to.equal(51);
    expect(await contract.tierFor(75)).to.equal(51);
    expect(await contract.tierFor(76)).to.equal(76);
    expect(await contract.tierFor(100)).to.equal(76);
  });

  it("reverts tokenURI when CID not set", async () => {
    await expect(contract.tokenURI(5, 1)).to.be.revertedWith("CID not set for tier");
  });

  it("reverts setTierCID with empty CID", async () => {
    await expect(contract.connect(owner).setTierCID(1, ""))
      .to.be.revertedWith("Empty CID");
  });

  it("reverts setTierCID with invalid tier", async () => {
    await expect(contract.connect(owner).setTierCID(42, "QmX"))
      .to.be.revertedWith("Invalid tier");
  });

  it("only owner can set CID", async () => {
    await expect(contract.connect(other).setTierCID(1, "QmX"))
      .to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });
});

// ─── AnalyticsRegistry ───────────────────────────────────────────────────────
describe("AnalyticsRegistry", () => {
  let contract, oracle, user, other;
  const WEEKLY = 0, MONTHLY = 1;

  beforeEach(async () => {
    [, oracle, user, other] = await ethers.getSigners();
    contract = await ethers.deployContract("AnalyticsRegistry", [oracle.address]);
  });

  it("anchors a weekly snapshot", async () => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("week-1-digest"));
    await expect(contract.connect(oracle).anchorSnapshot(user.address, hash, WEEKLY))
      .to.emit(contract, "SnapshotAnchored")
      .withArgs(user.address, hash, WEEKLY, anyValue);
    expect(await contract.snapshotCount(user.address)).to.equal(1);
  });

  it("returns latest snapshot per period", async () => {
    const h1 = ethers.keccak256(ethers.toUtf8Bytes("week-1"));
    const h2 = ethers.keccak256(ethers.toUtf8Bytes("week-2"));
    await contract.connect(oracle).anchorSnapshot(user.address, h1, WEEKLY);
    await contract.connect(oracle).anchorSnapshot(user.address, h2, WEEKLY);
    const latest = await contract.latestSnapshot(user.address, WEEKLY);
    expect(latest.digestHash).to.equal(h2);
  });

  it("tracks weekly and monthly independently", async () => {
    const hw = ethers.keccak256(ethers.toUtf8Bytes("weekly"));
    const hm = ethers.keccak256(ethers.toUtf8Bytes("monthly"));
    await contract.connect(oracle).anchorSnapshot(user.address, hw, WEEKLY);
    await contract.connect(oracle).anchorSnapshot(user.address, hm, MONTHLY);
    expect((await contract.latestSnapshot(user.address, WEEKLY)).digestHash).to.equal(hw);
    expect((await contract.latestSnapshot(user.address, MONTHLY)).digestHash).to.equal(hm);
  });

  it("reverts on invalid period", async () => {
    await expect(contract.connect(oracle).anchorSnapshot(user.address, ethers.keccak256(ethers.toUtf8Bytes("x")), 2))
      .to.be.revertedWith("Invalid period");
  });

  it("reverts latestSnapshot with no entries", async () => {
    await expect(contract.latestSnapshot(user.address, WEEKLY))
      .to.be.revertedWith("No snapshot");
  });

  it("only oracle can anchor", async () => {
    await expect(contract.connect(other).anchorSnapshot(user.address, ethers.keccak256(ethers.toUtf8Bytes("x")), WEEKLY))
      .to.be.revertedWith("Not oracle");
  });

  it("oracle can rotate oracle address", async () => {
    await expect(contract.connect(oracle).setOracle(other.address))
      .to.emit(contract, "OracleUpdated").withArgs(oracle.address, other.address);
    expect(await contract.oracle()).to.equal(other.address);
  });
});

// ─── RewardsEngine streak tiers ──────────────────────────────────────────────
describe("RewardsEngine — streak rewards", () => {
  let contract, mockCUSD, owner, oracle, user;
  const ONE = ethers.parseEther("1");

  beforeEach(async () => {
    [owner, oracle, user] = await ethers.getSigners();
    mockCUSD = await ethers.deployContract("MockCUSD");
    contract = await ethers.deployContract("RewardsEngine", [
      await mockCUSD.getAddress(), oracle.address,
    ]);
    // Fund contract with 50 cUSD
    await mockCUSD.mint(owner.address, ONE * 50n);
    await mockCUSD.connect(owner).approve(await contract.getAddress(), ONE * 50n);
    await contract.connect(owner).deposit(ONE * 50n);
  });

  it("pays 0.5 cUSD at 7-day streak", async () => {
    await expect(contract.connect(oracle).rewardStreak(user.address, 7))
      .to.emit(contract, "StreakRewardPaid").withArgs(user.address, 7, ethers.parseEther("0.5"));
    expect(await mockCUSD.balanceOf(user.address)).to.equal(ethers.parseEther("0.5"));
  });

  it("pays 2 cUSD at 30-day streak", async () => {
    await contract.connect(oracle).rewardStreak(user.address, 7);
    await expect(contract.connect(oracle).rewardStreak(user.address, 30))
      .to.emit(contract, "StreakRewardPaid").withArgs(user.address, 30, ethers.parseEther("2"));
  });

  it("pays 10 cUSD at 100-day streak", async () => {
    await contract.connect(oracle).rewardStreak(user.address, 7);
    await contract.connect(oracle).rewardStreak(user.address, 30);
    await expect(contract.connect(oracle).rewardStreak(user.address, 100))
      .to.emit(contract, "StreakRewardPaid").withArgs(user.address, 100, ethers.parseEther("10"));
  });

  it("does not re-pay same tier", async () => {
    await contract.connect(oracle).rewardStreak(user.address, 7);
    await expect(contract.connect(oracle).rewardStreak(user.address, 7))
      .to.be.revertedWith("No new tier reached");
  });

  it("pays all crossed tiers when jumping from 0 to 100 days", async () => {
    // Should receive tier1 + tier2 + tier3 = 0.5 + 2 + 10 = 12.5 cUSD
    await expect(contract.connect(oracle).rewardStreak(user.address, 100))
      .to.emit(contract, "StreakRewardPaid")
      .withArgs(user.address, 100, ethers.parseEther("12.5"));
    expect(await mockCUSD.balanceOf(user.address)).to.equal(ethers.parseEther("12.5"));
  });

  it("owner can update streak reward amounts", async () => {
    await expect(contract.connect(owner).setStreakRewards(
      ethers.parseEther("1"),
      ethers.parseEther("5"),
      ethers.parseEther("20")
    )).to.emit(contract, "StreakRewardsUpdated");
    expect(await contract.streakReward1()).to.equal(ethers.parseEther("1"));
  });
});

// ─── GrowthNFT + MetadataRenderer integration ────────────────────────────────
describe("GrowthNFT — MetadataRenderer integration", () => {
  let nft, renderer, owner, oracle, user;

  beforeEach(async () => {
    [owner, oracle, user] = await ethers.getSigners();
    renderer = await ethers.deployContract("MetadataRenderer");
    nft      = await ethers.deployContract("GrowthNFT", [oracle.address]);
    await renderer.connect(owner).setTierCID(1,  "QmSeedling");
    await renderer.connect(owner).setTierCID(11, "QmSprout");
    await nft.connect(owner).setRenderer(await renderer.getAddress());
  });

  it("resolves tokenURI via renderer after mint", async () => {
    await nft.connect(oracle).mint(user.address, "");
    expect(await nft.tokenURI(1)).to.equal("ipfs://QmSeedling/1.json");
  });

  it("resolves new tier URI after level up", async () => {
    await nft.connect(oracle).mint(user.address, "");
    await nft.connect(oracle).updateGrowth(user.address, 15, 15, 20, "");
    expect(await nft.tokenURI(1)).to.equal("ipfs://QmSprout/1.json");
  });

  it("emits RendererUpdated when renderer is set", async () => {
    const nft2 = await ethers.deployContract("GrowthNFT", [oracle.address]);
    await expect(nft2.connect(owner).setRenderer(await renderer.getAddress()))
      .to.emit(nft2, "RendererUpdated");
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function latestTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}
