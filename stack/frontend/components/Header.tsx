"use client";

import { useEffect, useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";
import { useNotifications } from "@/components/NotificationsPanel";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { SettingsPanel } from "@/components/SettingsPanel";

export function Header() {
  const { isConnected, stxAddress, connect, disconnect } = useStacksAuth();
  const [mounted, setMounted] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { unreadCount } = useNotifications(stxAddress);

  useEffect(() => { setMounted(true); }, []);

  return (
    <>
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
          <div className="flex items-center gap-2">
            {isConnected && (
              <>
                {/* Notifications bell */}
                <button onClick={() => setShowNotifs(true)}
                  className="relative text-gray-400 hover:text-white transition-colors p-1">
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-black text-xs font-bold rounded-full flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {/* Settings */}
                <button onClick={() => setShowSettings(true)}
                  className="text-gray-400 hover:text-white transition-colors p-1">
                  ⚙️
                </button>
              </>
            )}

            {isConnected ? (
              <button onClick={disconnect}
                className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-1.5 rounded-full transition-all font-mono">
                {stxAddress?.slice(0, 6)}…{stxAddress?.slice(-4)}
              </button>
            ) : (
              <button onClick={connect}
                className="text-sm bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-black font-bold px-4 py-1.5 rounded-full transition-all shadow-lg shadow-orange-500/20">
                Connect Wallet
              </button>
            )}
          </div>
        )}
      </header>

      {showNotifs && stxAddress && (
        <NotificationsPanel addr={stxAddress} onClose={() => setShowNotifs(false)} />
      )}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
