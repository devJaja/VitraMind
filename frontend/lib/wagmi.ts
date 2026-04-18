import { createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected } from "wagmi/connectors";

function getMiniPayProvider() {
  if (typeof window === "undefined") return undefined;
  const eth = window.ethereum as { isMiniPay?: boolean } | undefined;
  return eth?.isMiniPay ? window.ethereum : undefined;
}

// Resolve window.ethereum lazily — only when called, never on module load.
// This prevents wagmi from probing the provider on mount, which triggers
// MetaMask's evmAsk.js "Unexpected error" console log.
function getBrowserProvider() {
  if (typeof window === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window.ethereum as any) ?? undefined;
}

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    // MiniPay — auto-connects inside MiniPay wallet
    injected({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: () => ({ id: "minipay",       name: "MiniPay",        provider: getMiniPayProvider() as any }),
    }),
    // Browser wallet — provider resolved lazily, used for manual connect + auto-reconnect
    injected({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: () => ({ id: "browserWallet", name: "Browser Wallet", provider: getBrowserProvider() as any }),
    }),
  ],
  transports: {
    [celo.id]:          http("https://forno.celo.org"),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
});
