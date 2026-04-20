"use client";

import { useEffect, useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";

export function Header() {
  const { isConnected, stxAddress, connect, disconnect } = useStacksAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60 bg-black/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
          🌱 VitraMind
        </span>
        <span className="text-xs bg-orange-400 text-black px-2 py-0.5 rounded-full font-semibold">
          Stacks
        </span>
      </div>

      {mounted && (
        <div className="flex flex-col items-end gap-0.5">
          {isConnected ? (
            <button
              onClick={disconnect}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-1.5 rounded-full transition-all font-mono"
            >
              {stxAddress?.slice(0, 6)}…{stxAddress?.slice(-4)}
            </button>
          ) : (
            <button
              onClick={connect}
              className="text-sm bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-black font-bold px-4 py-1.5 rounded-full transition-all shadow-lg shadow-orange-500/20"
            >
              Connect Wallet
            </button>
          )}
        </div>
      )}
    </header>
  );
}
