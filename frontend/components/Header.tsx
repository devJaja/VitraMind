"use client";

import { useMiniPay } from "@/hooks/useMiniPay";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function Header() {
  const { isMiniPay, isConnected, address, hideConnectBtn } = useMiniPay();
  const { connect } = useConnect();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-black">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-white">🌱 VitraMind</span>
        {isMiniPay && (
          <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-medium">
            MiniPay
          </span>
        )}
      </div>

      {/* Hidden inside MiniPay — wallet is auto-connected */}
      {!hideConnectBtn && (
        <button
          onClick={() => connect({ connector: injected() })}
          className="text-sm bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          {isConnected ? `${address?.slice(0, 6)}…${address?.slice(-4)}` : "Connect Wallet"}
        </button>
      )}

      {/* Inside MiniPay: show address inline */}
      {hideConnectBtn && isConnected && (
        <span className="text-xs text-gray-400 font-mono">
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </span>
      )}
    </header>
  );
}
