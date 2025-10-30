import hre from "hardhat";
import fs from "fs";
import path from "path";

function explorerBase(networkName: string): string {
  if (networkName === "baseMainnet") return "https://basescan.org";
  if (networkName === "baseSepolia") return "https://sepolia.basescan.org";
  // fallback
  return "";
}

async function main() {
  const { ethers, upgrades, run, network } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("=== PayDrip deploy ===");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);

  // Deploy proxy (UUPS)
  const PayDrip = await ethers.getContractFactory("PayDrip");
  const proxy = await upgrades.deployProxy(PayDrip, [deployer.address], {
    kind: "uups",
    initializer: "initialize",
  });
  const tx = proxy.deploymentTransaction();
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress).catch(() => null);

  const exp = explorerBase(network.name);
  console.log("");
  console.log("Addresses:");
  console.log("  Proxy:           ", proxyAddress, exp ? `(${exp}/address/${proxyAddress})` : "");
  console.log(
    "  Implementation:  ",
    implementationAddress,
    exp ? `(${exp}/address/${implementationAddress})` : ""
  );
  if (adminAddress) {
    console.log("  ProxyAdmin (1967):", adminAddress, exp ? `(${exp}/address/${adminAddress})` : "");
  }
  console.log("  Deploy tx:", tx?.hash || "(n/a)");
  console.log("");

  // Verify implementation on Basescan
  try {
    await run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [],
    });
    console.log("Verification: implementation verified on Basescan");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log("Verification skipped/failed:", msg);
  }

  // Persist deployment JSON
  const outDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outfile = path.join(outDir, `${network.name}.json`);
  const payload = {
    network: network.name,
    proxy: proxyAddress,
    implementation: implementationAddress,
    admin: adminAddress,
    deployer: deployer.address,
    txHashProxy: tx?.hash ?? null,
    commit: process.env.GITHUB_SHA || null,
    timestamp: Math.floor(Date.now() / 1000),
    explorer: exp || null,
  };
  fs.writeFileSync(outfile, JSON.stringify(payload, null, 2));
  console.log("Wrote", outfile);

  // Also print a compact summary for CI summary & logs
  console.log("");
  console.log("=== Deployment summary ===");
  console.log(`network:  ${network.name}`);
  console.log(`proxy:    ${proxyAddress}`);
  console.log(`impl:     ${implementationAddress}`);
  if (adminAddress) console.log(`admin:    ${adminAddress}`);
  if (tx?.hash) console.log(`tx:       ${tx.hash}`);
  if (exp) {
    console.log(`explorer: ${exp}/address/${proxyAddress}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
