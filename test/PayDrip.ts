import { expect } from "chai";
import hre from "hardhat";

describe("PayDrip", function () {
  it("initializes and drips", async function () {
    const { ethers, upgrades } = hre;
    const [owner, alice] = await ethers.getSigners();

    const PayDrip = await ethers.getContractFactory("PayDrip");
    const drip = await upgrades.deployProxy(PayDrip, [owner.address], {
      kind: "uups",
      initializer: "initialize",
    });

    await drip.waitForDeployment();

    // fund
    await owner.sendTransaction({
      to: await drip.getAddress(),
      value: ethers.parseEther("1"),
    });

    // set rate for alice
    await (await drip.connect(owner).setRate(alice.address, 1000n)).wait();

    // move time forward
    await ethers.provider.send("evm_increaseTime", [10]);
    await ethers.provider.send("evm_mine", []);

    const preview = await drip.previewAccrued(alice.address);
    expect(preview).to.be.greaterThan(0n);

    const before = await ethers.provider.getBalance(alice.address);
    await (await drip.connect(alice).withdrawAll()).wait();
    const after = await ethers.provider.getBalance(alice.address);
    expect(after).to.be.greaterThan(before);
  });
});
