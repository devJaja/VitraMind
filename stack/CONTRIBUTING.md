# Contributing to VitraMind

Thank you for your interest in contributing! VitraMind is a privacy-first personal growth app built on Bitcoin via Stacks.

## Development Setup

```bash
git clone https://github.com/devJaja/VitraMind.git
cd VitraMind/stack

# Contracts
cd contracts && npm install

# Frontend
cd ../frontend && npm install && npm run dev
```

## Project Structure

```
stack/
├── contracts/
│   ├── clarity/contracts/   # Clarity smart contracts
│   ├── clarity/tests/       # Clarinet tests
│   ├── scripts/             # Deploy & interact scripts
│   └── src/                 # Solidity contracts (Celo)
└── frontend/
    ├── app/                 # Next.js app router
    ├── components/          # React components
    ├── hooks/               # Stacks read-only hooks
    └── lib/                 # Utilities & storage
```

## Contribution Guidelines

### Smart Contracts
- All Clarity contracts must pass `clarinet check` before PR
- New contracts need corresponding tests in `clarity/tests/`
- Privacy rule: **no raw personal data ever on-chain** — only hashes
- Oracle-gated functions must enforce `(is-eq tx-sender oracle)` checks

### Frontend
- Components must be accessible (ARIA labels, keyboard nav)
- No wallet private keys or secrets in any client-side code
- All on-chain calls go through `@stacks/connect` (user-signed)
- Local data stays in `localStorage` — never sent to a server

### Commits
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat(scope): description
fix(scope): description
chore(scope): description
test(scope): description
docs(scope): description
refactor(scope): description
```

### Pull Requests
1. Fork the repo and create a feature branch
2. Write tests for new contract functions
3. Run `clarinet check` and `clarinet test`
4. Open a PR with a clear description of changes

## Security

See [SECURITY.md](SECURITY.md) for responsible disclosure guidelines.

## License

MIT — see [LICENSE](LICENSE).
