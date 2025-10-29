import { ethers, upgrades, run, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network:", network.name);

  const PayDrip = await ethers.getContractFactory("PayDrip");
  const proxy = await upgrades.deployProxy(PayDrip, [deployer.address], {
    kind: "uups",
    initializer: "initialize"
  });
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("PayDrip proxy:", proxyAddress);
  console.log("PayDrip implementation:", implementationAddress);

  try {
    await run("verify:verify", {
      address: implementationAddress,
      constructorArguments: []
    });
    console.log("Verified implementation on Basescan");
  } catch (e: any) {
    console.log("Verification skipped/failed:", e.message || e.toString());
  }

  const outDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outfile = path.join(outDir, `${network.name}.json`);
  const payload = {
    network: network.name,
    proxy: proxyAddress,
    implementation: implementationAddress,
    deployer: deployer.address,
    commit: process.env.GITHUB_SHA || null,
    timestamp: Math.floor(Date.now() / 1000)
  };
  fs.writeFileSync(outfile, JSON.stringify(payload, null, 2));
  console.log("Wrote", outfile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
