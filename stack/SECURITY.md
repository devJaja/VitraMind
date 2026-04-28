# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | ✅        |

## Privacy Architecture

VitraMind is designed with privacy as a first principle:

- **No raw personal data on-chain** — only SHA-256/keccak256 hashes
- **Local-first storage** — journal entries stay in `localStorage`
- **User-signed transactions** — all on-chain calls are signed by the user's wallet
- **No backend custody** — the frontend is a static Next.js app

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public GitHub issue.

Instead, email: **security@vitramind.app** (or open a private GitHub security advisory)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and aim to patch critical issues within 7 days.

## Scope

### In Scope
- Smart contract vulnerabilities (reentrancy, access control bypass, integer overflow)
- Frontend XSS or injection vulnerabilities
- Private key exposure risks
- Logic errors that could allow unauthorized on-chain writes

### Out of Scope
- Theoretical attacks with no practical exploit path
- Issues in third-party dependencies (report to upstream)
- Social engineering attacks

## Responsible Disclosure

We follow coordinated disclosure. We will:
1. Acknowledge receipt within 48 hours
2. Investigate and confirm the issue
3. Develop and test a fix
4. Release the fix and credit the reporter (if desired)
