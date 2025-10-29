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

    // fund the contract with 1 ETH so withdrawals are payable
    await owner.sendTransaction({
      to: await drip.getAddress(),
      value: ethers.parseEther("1"),
    });

    // set a small rate for alice and move time forward
    await (await drip.connect(owner).setRate(alice.address, 1000n)).wait(); // 1000 wei/sec
    await ethers.provider.send("evm_increaseTime", [10]);
    await ethers.provider.send("evm_mine", []);

    // preview > 0
    const preview = await drip.previewAccrued(alice.address);
    expect(preview).to.be.greaterThan(0n);

    // withdrawAll should increase alice's balance exactly by `preview`
    // (matcher учитывает газ и сравнивает чистое изменение баланса)
    await expect(drip.connect(alice).withdrawAll()).to.changeEtherBalance(
      alice,
      preview
    );

    // после вывода новый preview ~ 0
    const afterPreview = await drip.previewAccrued(alice.address);
    expect(afterPreview).to.equal(0n);
  });
});
