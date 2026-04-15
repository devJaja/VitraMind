const { expect } = require("chai");
const { ethers }  = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeSignals(nullifier, streakCommitment, minStreak) {
  return [
    BigInt(nullifier),
    BigInt(streakCommitment),
    BigInt(minStreak),
  ];
}

// ─── ZKStreakVerifier ─────────────────────────────────────────────────────────
describe("ZKStreakVerifier", () => {
  let zkVerifier, mockVerifier, owner, user, other;
  const PROOF_A = [1n, 2n];
  const PROOF_B = [[3n, 4n], [5n, 6n]];
  const PROOF_C = [7n, 8n];

  beforeEach(async () => {
    [owner, user, other] = await ethers.getSigners();
    mockVerifier = await ethers.deployContract("MockGroth16Verifier");
    zkVerifier   = await ethers.deployContract("ZKStreakVerifier", [await mockVerifier.getAddress()]);
  });

  it("accepts a valid proof and records milestone", async () => {
    const nullifier = ethers.keccak256(ethers.toUtf8Bytes("null-1"));
    const signals   = makeSignals(nullifier, ethers.keccak256(ethers.toUtf8Bytes("commit-1")), 7);
    await expect(zkVerifier.connect(user).proveStreak(PROOF_A, PROOF_B, PROOF_C, signals))
      .to.emit(zkVerifier, "StreakProven")
      .withArgs(user.address, 7n, nullifier);
    expect(await zkVerifier.hasProvenStreak(user.address, 7)).to.be.true;
  });

  it("rejects a replayed nullifier", async () => {
    const nullifier = ethers.keccak256(ethers.toUtf8Bytes("null-2"));
    const signals   = makeSignals(nullifier, ethers.keccak256(ethers.toUtf8Bytes("commit-2")), 7);
    await zkVerifier.connect(user).proveStreak(PROOF_A, PROOF_B, PROOF_C, signals);
    await expect(zkVerifier.connect(user).proveStreak(PROOF_A, PROOF_B, PROOF_C, signals))
      .to.be.revertedWith("Proof already used");
  });

  it("rejects an invalid proof", async () => {
    await mockVerifier.setShouldReject(true);
    const nullifier = ethers.keccak256(ethers.toUtf8Bytes("null-3"));
    const signals   = makeSignals(nullifier, ethers.keccak256(ethers.toUtf8Bytes("commit-3")), 7);
    await expect(zkVerifier.connect(user).proveStreak(PROOF_A, PROOF_B, PROOF_C, signals))
      .to.be.revertedWith("Invalid proof");
  });

  it("rejects wrong number of public signals", async () => {
    await expect(zkVerifier.connect(user).proveStreak(PROOF_A, PROOF_B, PROOF_C, [1n, 2n]))
      .to.be.revertedWith("Invalid signals");
  });

  it("returns false for unproven milestone", async () => {
    expect(await zkVerifier.hasProvenStreak(user.address, 30)).to.be.false;
  });

  it("supports multiple milestones independently", async () => {
    const n1 = ethers.keccak256(ethers.toUtf8Bytes("n1"));
    const n2 = ethers.keccak256(ethers.toUtf8Bytes("n2"));
    await zkVerifier.connect(user).proveStreak(PROOF_A, PROOF_B, PROOF_C, makeSignals(n1, ethers.keccak256(ethers.toUtf8Bytes("c1")), 7));
    await zkVerifier.connect(user).proveStreak(PROOF_A, PROOF_B, PROOF_C, makeSignals(n2, ethers.keccak256(ethers.toUtf8Bytes("c2")), 30));
    expect(await zkVerifier.hasProvenStreak(user.address, 7)).to.be.true;
    expect(await zkVerifier.hasProvenStreak(user.address, 30)).to.be.true;
    expect(await zkVerifier.hasProvenStreak(user.address, 100)).to.be.false;
  });

  it("owner can upgrade verifier contract", async () => {
    const newVerifier = await ethers.deployContract("MockGroth16Verifier");
    await expect(zkVerifier.connect(owner).setVerifier(await newVerifier.getAddress()))
      .to.emit(zkVerifier, "VerifierUpdated");
    expect(await zkVerifier.verifier()).to.equal(await newVerifier.getAddress());
  });

  it("reverts setVerifier with zero address", async () => {
    await expect(zkVerifier.connect(owner).setVerifier(ethers.ZeroAddress))
      .to.be.revertedWith("Zero verifier");
  });
});

// ─── IPFSExportRegistry ───────────────────────────────────────────────────────
describe("IPFSExportRegistry", () => {
  let contract, user, other;
  const ExportType = { FULL: 0, LOGS: 1, INSIGHTS: 2, ANALYTICS: 3 };

  beforeEach(async () => {
    [, user, other] = await ethers.getSigners();
    contract = await ethers.deployContract("IPFSExportRegistry");
  });

  it("anchors an export record", async () => {
    const cid  = "QmExportFull";
    const hash = ethers.keccak256(ethers.toUtf8Bytes("plaintext-data"));
    await expect(contract.connect(user).anchorExport(cid, hash, ExportType.FULL))
      .to.emit(contract, "ExportAnchored")
      .withArgs(user.address, cid, hash, ExportType.FULL, anyValue);
    expect(await contract.exportCount(user.address)).to.equal(1);
  });

  it("returns latest export", async () => {
    const h1 = ethers.keccak256(ethers.toUtf8Bytes("v1"));
    const h2 = ethers.keccak256(ethers.toUtf8Bytes("v2"));
    await contract.connect(user).anchorExport("Qm1", h1, ExportType.LOGS);
    await contract.connect(user).anchorExport("Qm2", h2, ExportType.LOGS);
    const latest = await contract.latestExport(user.address);
    expect(latest.contentHash).to.equal(h2);
    expect(latest.cid).to.equal("Qm2");
  });

  it("verifies a content hash exists", async () => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("my-data"));
    await contract.connect(user).anchorExport("QmX", hash, ExportType.INSIGHTS);
    expect(await contract.verifyExport(user.address, hash)).to.be.true;
    expect(await contract.verifyExport(user.address, ethers.keccak256(ethers.toUtf8Bytes("other")))).to.be.false;
  });

  it("reverts on empty CID", async () => {
    await expect(contract.connect(user).anchorExport("", ethers.keccak256(ethers.toUtf8Bytes("x")), ExportType.FULL))
      .to.be.revertedWith("Empty CID");
  });

  it("reverts on zero content hash", async () => {
    await expect(contract.connect(user).anchorExport("QmX", ethers.ZeroHash, ExportType.FULL))
      .to.be.revertedWith("Invalid hash");
  });

  it("reverts latestExport with no records", async () => {
    await expect(contract.latestExport(user.address)).to.be.revertedWith("No exports");
  });

  it("reverts getExport out of bounds", async () => {
    await expect(contract.getExport(user.address, 0)).to.be.revertedWith("Out of bounds");
  });

  it("tracks exports per user independently", async () => {
    const h1 = ethers.keccak256(ethers.toUtf8Bytes("user1"));
    const h2 = ethers.keccak256(ethers.toUtf8Bytes("user2"));
    await contract.connect(user).anchorExport("Qm1", h1, ExportType.FULL);
    await contract.connect(other).anchorExport("Qm2", h2, ExportType.FULL);
    expect(await contract.exportCount(user.address)).to.equal(1);
    expect(await contract.exportCount(other.address)).to.equal(1);
    expect(await contract.verifyExport(user.address, h2)).to.be.false;
  });
});

// ─── GrowthIdentity ───────────────────────────────────────────────────────────
describe("GrowthIdentity", () => {
  let contract, owner, user, appAddr, other;

  beforeEach(async () => {
    [owner, user, appAddr, other] = await ethers.getSigners();
    contract = await ethers.deployContract("GrowthIdentity");
  });

  it("publishes an identity", async () => {
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("identity-bundle"));
    await expect(contract.connect(user).publishIdentity(commitment, 5))
      .to.emit(contract, "IdentityPublished")
      .withArgs(user.address, commitment, 5);
    expect(await contract.hasActiveIdentity(user.address)).to.be.true;
  });

  it("allows updating identity", async () => {
    const c1 = ethers.keccak256(ethers.toUtf8Bytes("v1"));
    const c2 = ethers.keccak256(ethers.toUtf8Bytes("v2"));
    await contract.connect(user).publishIdentity(c1, 5);
    await contract.connect(user).publishIdentity(c2, 10);
    expect((await contract.identities(user.address)).commitment).to.equal(c2);
    expect((await contract.identities(user.address)).growthLevel).to.equal(10);
  });

  it("deactivates identity", async () => {
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("bundle"));
    await contract.connect(user).publishIdentity(commitment, 5);
    await expect(contract.connect(user).deactivateIdentity())
      .to.emit(contract, "IdentityDeactivated").withArgs(user.address);
    expect(await contract.hasActiveIdentity(user.address)).to.be.false;
  });

  it("registers an app and records verification", async () => {
    await expect(contract.connect(owner).registerApp("TestApp", appAddr.address))
      .to.emit(contract, "AppRegistered").withArgs(0, "TestApp", appAddr.address);

    const commitment = ethers.keccak256(ethers.toUtf8Bytes("bundle"));
    await contract.connect(user).publishIdentity(commitment, 5);

    await expect(contract.connect(appAddr).recordVerification(0, user.address))
      .to.emit(contract, "AppVerified").withArgs(0, user.address);
    expect(await contract.appVerifications(0, user.address)).to.be.true;
  });

  it("reverts recordVerification from unauthorized caller", async () => {
    await contract.connect(owner).registerApp("App", appAddr.address);
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("bundle"));
    await contract.connect(user).publishIdentity(commitment, 5);
    await expect(contract.connect(other).recordVerification(0, user.address))
      .to.be.revertedWith("Unauthorized");
  });

  it("reverts publishIdentity with zero commitment", async () => {
    await expect(contract.connect(user).publishIdentity(ethers.ZeroHash, 5))
      .to.be.revertedWith("Invalid commitment");
  });

  it("reverts deactivateIdentity with no identity", async () => {
    await expect(contract.connect(other).deactivateIdentity())
      .to.be.revertedWith("No identity");
  });

  it("returns false for user with no identity", async () => {
    expect(await contract.hasActiveIdentity(other.address)).to.be.false;
  });
});

// ─── WellnessProtocol ─────────────────────────────────────────────────────────
describe("WellnessProtocol", () => {
  let contract, owner, creator, user, other;

  beforeEach(async () => {
    [owner, creator, user, other] = await ethers.getSigners();
    contract = await ethers.deployContract("WellnessProtocol");
  });

  it("registers a protocol", async () => {
    await expect(contract.connect(creator).registerProtocol("30-Day Meditation", "QmSchema"))
      .to.emit(contract, "ProtocolRegistered").withArgs(0, "30-Day Meditation", creator.address);
    expect(await contract.protocolCount()).to.equal(1);
    expect((await contract.protocols(0)).active).to.be.true;
  });

  it("user opts in and commits progress", async () => {
    await contract.connect(creator).registerProtocol("Sleep Hygiene", "QmSleep");
    await expect(contract.connect(user).optIn(0))
      .to.emit(contract, "UserOptedIn").withArgs(0, user.address);

    const hash = ethers.keccak256(ethers.toUtf8Bytes("day-1-progress"));
    await expect(contract.connect(user).commitProgress(0, hash))
      .to.emit(contract, "ProgressCommitted").withArgs(0, user.address, hash);
    expect((await contract.progress(0, user.address)).commitmentHash).to.equal(hash);
  });

  it("user opts out", async () => {
    await contract.connect(creator).registerProtocol("Protocol", "QmX");
    await contract.connect(user).optIn(0);
    await expect(contract.connect(user).optOut(0))
      .to.emit(contract, "UserOptedOut").withArgs(0, user.address);
    expect(await contract.optedIn(0, user.address)).to.be.false;
  });

  it("creator can deactivate protocol", async () => {
    await contract.connect(creator).registerProtocol("Protocol", "QmX");
    await expect(contract.connect(creator).deactivateProtocol(0))
      .to.emit(contract, "ProtocolDeactivated").withArgs(0);
    expect((await contract.protocols(0)).active).to.be.false;
  });

  it("owner can deactivate any protocol", async () => {
    await contract.connect(creator).registerProtocol("Protocol", "QmX");
    await expect(contract.connect(owner).deactivateProtocol(0))
      .to.emit(contract, "ProtocolDeactivated");
  });

  it("reverts optIn to inactive protocol", async () => {
    await contract.connect(creator).registerProtocol("Protocol", "QmX");
    await contract.connect(creator).deactivateProtocol(0);
    await expect(contract.connect(user).optIn(0)).to.be.revertedWith("Protocol inactive");
  });

  it("reverts commitProgress when not opted in", async () => {
    await contract.connect(creator).registerProtocol("Protocol", "QmX");
    await expect(contract.connect(user).commitProgress(0, ethers.keccak256(ethers.toUtf8Bytes("x"))))
      .to.be.revertedWith("Not opted in");
  });

  it("reverts double opt-in", async () => {
    await contract.connect(creator).registerProtocol("Protocol", "QmX");
    await contract.connect(user).optIn(0);
    await expect(contract.connect(user).optIn(0)).to.be.revertedWith("Already opted in");
  });

  it("reverts registerProtocol with empty name", async () => {
    await expect(contract.connect(creator).registerProtocol("", "QmX"))
      .to.be.revertedWith("Empty name");
  });

  it("reverts deactivateProtocol from unauthorized caller", async () => {
    await contract.connect(creator).registerProtocol("Protocol", "QmX");
    await expect(contract.connect(other).deactivateProtocol(0))
      .to.be.revertedWith("Unauthorized");
  });
});
