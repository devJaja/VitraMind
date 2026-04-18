import { createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected } from "wagmi/connectors";

function getMiniPayProvider() {
  if (typeof window === "undefined") return undefined;
  const eth = window.ethereum as { isMiniPay?: boolean } | undefined;
  return eth?.isMiniPay ? window.ethereum : undefined;
}

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    // MiniPay: scoped injected connector — only active when isMiniPay === true
    injected({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: () => ({ id: "minipay", name: "MiniPay", provider: getMiniPayProvider() as any }),
    }),
    // Browser wallets (MetaMask, Rabby, etc.) — standard injected connector
    injected({ target: "metaMask" }),
    injected(),
  ],
  transports: {
    [celo.id]:          http("https://forno.celo.org"),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
});
