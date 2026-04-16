import { createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Only expose the MiniPay provider — prevents MetaMask from being picked up
// as the injected connector in a desktop browser, which triggers its own
// internal "Unexpected error" log from evmAsk.js
function getMiniPayProvider() {
  if (typeof window === "undefined") return undefined;
  const eth = window.ethereum as { isMiniPay?: boolean } | undefined;
  return eth?.isMiniPay ? window.ethereum : undefined;
}

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    injected({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: () => ({ id: "minipay", name: "MiniPay", provider: getMiniPayProvider() as any }),
    }),
  ],
  transports: {
    [celo.id]:          http("https://forno.celo.org"),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
});
