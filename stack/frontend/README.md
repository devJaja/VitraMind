# VitraMind Frontend

Next.js MiniPay mini app for VitraMind — privacy-first personal growth on Celo.

## Stack

- **Next.js 16** (App Router)
- **wagmi v3 + viem v2** — Celo wallet integration
- **Tailwind CSS v4**

## MiniPay Hooks

### `useMiniPay`
Detects MiniPay, auto-connects the injected wallet, and returns `hideConnectBtn` to suppress the connect button per [MiniPay docs](https://docs.celo.org/build-on-celo/build-on-minipay/quickstart).

```ts
const { isMiniPay, isConnected, address, hideConnectBtn } = useMiniPay();
```

### `useMiniPayCUSD`
Wraps `sendTransaction` to inject `feeCurrency: cUSD` when inside MiniPay, so gas is paid in cUSD instead of CELO. Falls back to a plain transaction outside MiniPay.

```ts
const { writeContract } = useMiniPayCUSD();

await writeContract({ address, abi, functionName, args });
//  ↳ inside MiniPay  → { to, data, feeCurrency: "0x874069..." }
//  ↳ outside MiniPay → { to, data }
```

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

| Network | Chain ID | cUSD |
|---|---|---|
| Celo Mainnet | 42220 | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| Alfajores Testnet | 44787 | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |
