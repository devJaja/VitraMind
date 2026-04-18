"use client";

import { useMiniPay } from "@/hooks/useMiniPay";
import { useConnect } from "wagmi";

export function Header() {
  const { isMiniPay, isConnected, address, hideConnectBtn } = useMiniPay();
  const { connect, connectors } = useConnect();

  function handleConnect() {
    // Inside MiniPay use the scoped connector; outside use MetaMask or any injected
    const c =
      connectors.find((c) => c.id === "minipay") ??
      connectors.find((c) => c.id === "metaMask") ??
      connectors.find((c) => c.id === "injected");
    if (c) connect({ connector: c }, { onError: () => {} });
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60 bg-black/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
          🌱 VitraMind
        </span>
        {isMiniPay && (
          <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-semibold">
            MiniPay
          </span>
        )}
      </div>

      {!hideConnectBtn && (
        <button
          onClick={handleConnect}
          className="text-sm bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-400 hover:to-emerald-300 text-black font-bold px-4 py-1.5 rounded-full transition-all shadow-lg shadow-green-500/20"
        >
          {isConnected ? `${address?.slice(0, 6)}…${address?.slice(-4)}` : "Connect Wallet"}
        </button>
      )}

      {hideConnectBtn && isConnected && (
        <span className="text-xs text-gray-400 font-mono">
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </span>
      )}
    </header>
  );
}
