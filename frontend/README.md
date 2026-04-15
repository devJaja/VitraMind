# VitraMind Frontend

Next.js MiniPay mini app for VitraMind — privacy-first personal growth on Celo.

## Stack

- **Next.js 16** (App Router)
- **wagmi v3 + viem v2** — Celo wallet integration
- **Tailwind CSS v4**

## Key Hook

```ts
import { useMiniPay } from "@/hooks/useMiniPay";

const { isMiniPay, isConnected, address, hideConnectBtn } = useMiniPay();
```

Detects MiniPay, auto-connects the injected wallet, and returns `hideConnectBtn` to conditionally hide the connect button per [MiniPay docs](https://docs.celo.org/build-on-celo/build-on-minipay/quickstart).

## Setup

```bash
npm install
npm run dev        # localhost:3000
```

After deploying contracts, fill in addresses in `lib/contracts.ts`.

## Test in MiniPay

```bash
ngrok http 3000    # paste the URL into MiniPay Developer Settings → Load Test Page
```

## Networks

| Network | Chain ID |
|---|---|
| Celo Mainnet | 42220 |
| Alfajores Testnet | 44787 |
