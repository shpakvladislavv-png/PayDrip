# Security Policy

This repository is a **reference skeleton** and has **not** been audited. If you plan to use it in production:
- Use a multisig (e.g., Safe) as the admin/owner.
- Limit deployer privileges; store keys in hardware wallets.
- Monitor events and set up on-chain alerts.
- Run static analyzers and fuzzing before upgrades.
- Review storage layout before UUPS upgrades.
- Consider a professional audit.

To report a vulnerability, please open a security advisory or email the maintainers privately.
