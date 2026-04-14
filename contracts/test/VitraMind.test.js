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
