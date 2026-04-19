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
  ssr: true, // fixes hydration mismatch
  connectors: [
    // MiniPay — auto-connects inside MiniPay wallet
    injected({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: () => ({ id: "minipay", name: "MiniPay", provider: getMiniPayProvider() as any }),
    }),
    // Browser wallet — registered so wagmi can provide walletClient after connect
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [celo.id]:          http("https://forno.celo.org"),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
});
