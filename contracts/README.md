# VitraMind Contracts

Solidity 0.8.27 smart contract suite deployed on Celo mainnet.

## Contracts

| Contract | Address (Celo mainnet) |
|---|---|
| `ProfileAnchor` | `0x5930dD01989847697dB0F4240890F78eD6AC4577` |
| `ProofRegistry` | `0x4501199B23d6f29ebe5f3af55118708cFF8e6f2b` |
| `MetadataRenderer` | `0x3c40e69d858d83eD4712d532f0b897640B038473` |
| `GrowthNFT` | `0xB225effE84D95B4874842c94f04c8EA6183e39c1` |
| `StreakVerifier` | `0xc55D27d217cd6ABfa666bdd7CD29Aa2B7b2977d4` |
| `AnalyticsRegistry` | `0xA675088563DfB9f280140eFa297D878649159256` |
| `RewardsEngine` | `0x4e0dc019d7Ca54A31b9A9929d394AEf3E1396557` |
| `Groth16Verifier` | `0x6C23D31A1917D50d9638Ee67ddCc99962D372F90` |
| `ZKStreakVerifier` | `0xC3333e5f5c29B624B40fc8E7D3F70Ec71CED558B` |
| `IPFSExportRegistry` | `0x414A8B156808479B741Df1C9EF5E0Ea5208Fd80A` |
| `GrowthIdentity` | `0xB0e26442A400931972821351f01EfE1fF91C4d0A` |
| `WellnessProtocol` | `0xD8Ad321862084080732D745335f6370AddF3F380` |

## Setup

```bash
npm install
cp .env.example .env   # fill in PRIVATE_KEY, CUSD_ADDRESS, ORACLE_ADDRESS
```

## Commands

```bash
npm test                        # run 99 tests
npm run test:gas                # tests + gas report
npm run compile                 # compile contracts
npm run deploy:celo             # full deploy to mainnet
npm run deploy:alfajores        # full deploy to testnet
npm run zk:prove -- 30 7 <salt> # generate ZK streak proof
npm run zk:verify -- '<calldata>' # verify proof off-chain
```

## ZK Proofs

See [`zk/README.md`](zk/README.md) for the full ZK circuit pipeline.
