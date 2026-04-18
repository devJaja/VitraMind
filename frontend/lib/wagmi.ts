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
  // Only the MiniPay connector is registered — it returns undefined provider
  // outside MiniPay so wagmi never probes window.ethereum on mount.
  // The browser wallet connector is created inline at click time in Header.tsx.
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
