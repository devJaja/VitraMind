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
