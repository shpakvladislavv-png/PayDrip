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

    // preview > 0 (sanity)
    const preview = await drip.previewAccrued(alice.address);
    expect(preview).to.be.greaterThan(0n);

    // withdrawAll: читаем сумму из события Withdrawn и проверяем баланс контракта
    const provider = ethers.provider;
    const contractAddr = await drip.getAddress();
    const beforeContract = await provider.getBalance(contractAddr);

    const tx = await drip.connect(alice).withdrawAll();
    const receipt = await tx.wait();

    // извлечь событие Withdrawn(amount)
    const parsedLogs = (receipt?.logs || [])
      .map((log) => {
        try {
          return (drip.interface as any).parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Array<{ name: string; args: Record<string, unknown> }>;

    const withdrawnEv = parsedLogs.find((p) => p.name === "Withdrawn");
    expect(withdrawnEv, "Withdrawn event not found").to.exist;

    const amountUnknown = withdrawnEv?.args?.amount;
    expect(typeof amountUnknown === "bigint").to.equal(true);
    const amount = amountUnknown as bigint;

    expect(amount).to.be.greaterThan(0n);

    const afterContract = await provider.getBalance(contractAddr);
    // баланс контракта уменьшился ровно на сумму вывода
    expect(beforeContract - afterContract).to.equal(amount);

    // после вывода у alice больше нет начислений
    const afterPreview = await drip.previewAccrued(alice.address);
    expect(afterPreview).to.equal(0n);
  });
});
