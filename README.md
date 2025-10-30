# 💧 PayDrip

**PayDrip** is a smart contract protocol for continuous payment streaming and fund distribution built on **Base**.  
This repository contains a minimal UUPS-upgradeable implementation with full CI/CD automation via GitHub Actions.

---

## 🚀 Tech Stack

- **Solidity** — 0.8.26  
- **Hardhat** — development & deployment framework  
- **TypeScript** — scripts and tests  
- **OpenZeppelin Upgrades** — proxy contracts (UUPS pattern)  
- **GitHub Actions CI/CD** — automated testing, linting, and deployments

---

## 🧩 Project Structure

```
contracts/          — Solidity smart contracts  
scripts/            — deployment and upgrade scripts  
test/               — unit tests (Mocha / Chai)  
.github/workflows/  — CI/CD pipelines (lint, test, deploy)  
deployments/        — JSON deployment metadata for each network
```

## 🌍 Deployments

### 🧪 Base Sepolia
- Proxy: [`0x527fE59F9732283E6C84Aa7BCf47882EfE89AC41`](https://sepolia.basescan.org/address/0x527fE59F9732283E6C84Aa7BCf47882EfE89AC41)  
- Implementation: [`0xc1E269469c0D916B600840847C3193c0e3601A1f`](https://sepolia.basescan.org/address/0xc1E269469c0D916B600840847C3193c0e3601A1f)  
- Deployer: `0x59daA17673EFc0bECdC8819E69830B994Fe497fB`  
- Tx (proxy deploy): [`0x9442795319a4ef42aed7ff37fd48be9de27fded8a9728897c1e79a67a86a3b02`](https://sepolia.basescan.org/tx/0x9442795319a4ef42aed7ff37fd48be9de27fded8a9728897c1e79a67a86a3b02)

### 🔵 Base Mainnet
- Proxy: [`0xB7fB1434d757C91F59C02879EF616129240A9437`](https://basescan.org/address/0xB7fB1434d757C91F59C02879EF616129240A9437)  
- Implementation: [`0xd23327f19def48b0d15BFc581D3A0a0Ddba04ab8`](https://basescan.org/address/0xd23327f19def48b0d15BFc581D3A0a0Ddba04ab8)  
- Deployer: `0x59daA17673EFc0bECdC8819E69830B994Fe497fB`  
- Tx (proxy deploy): [`0x682b5bb24165e3b147dbcef43832cb07e157087eb37c133cc6eefe3776f13557`](https://basescan.org/tx/0x682b5bb24165e3b147dbcef43832cb07e157087eb37c133cc6eefe3776f13557)

## 📄 License

MIT © 2025 PayDrip
