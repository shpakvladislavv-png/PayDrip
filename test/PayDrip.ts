import { expect } from "chai";
import hre from "hardhat";
import type { Interface, Log, LogDescription } from "ethers";

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

    // sanity: preview > 0
    const preview = await drip.previewAccrued(alice.address);
    expect(preview).to.be.greaterThan(0n);

    // prepare parsing helpers
    const iface: Interface = PayDrip.interface;
    const contractAddr = await drip.getAddress();
    const provider = ethers.provider;

    const beforeContract = await provider.getBalance(contractAddr);

    const tx = await drip.connect(alice).withdrawAll();
    const receipt = await tx.wait();

    // parse Withdrawn event in a typesafe way
    const parsed: LogDescription[] = (receipt?.logs ?? [])
      .map((log) => {
        try {
          return iface.parseLog(log as Log);
        } catch {
          return null as unknown as LogDescription;
        }
      })
      .filter((x): x is LogDescription => Boolean(x));

    const withdrawn = parsed.find((ev) => ev.name === "Withdrawn");
    expect(withdrawn, "Withdrawn event not found").to.exist;

    const amount = withdrawn!.args.amount as bigint;
    expect(amount).to.be.greaterThan(0n);

    const afterContract = await provider.getBalance(contractAddr);

    // контракт отдал ровно amount
    expect(beforeContract - afterContract).to.equal(amount);

    // после вывода начислений нет
    const afterPreview = await drip.previewAccrued(alice.address);
    expect(afterPreview).to.equal(0n);
  });
});
