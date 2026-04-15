"use client";

import { useEffect, useState } from "react";
import { useConnect, useAccount } from "wagmi";
import { injected } from "wagmi/connectors";

/**
 * useMiniPay
 *
 * Detects whether the app is running inside the MiniPay wallet browser
 * and automatically connects the injected wallet if so.
 *
 * MiniPay injects `window.ethereum` with `isMiniPay = true`.
 * Per MiniPay docs, the "Connect Wallet" button must be hidden when
 * running inside MiniPay — the connection is implicit.
 *
 * Returns:
 *   isMiniPay      — true when running inside MiniPay
 *   isConnected    — wallet connection state
 *   address        — connected wallet address
 *   hideConnectBtn — convenience flag: hide connect button when true
 */
export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const { connect } = useConnect();
  const { isConnected, address } = useAccount();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.ethereum &&
      (window.ethereum as { isMiniPay?: boolean }).isMiniPay
    ) {
      setIsMiniPay(true);
      // Auto-connect — MiniPay wallet is always available, no user prompt needed
      connect({ connector: injected() });
    }
  }, [connect]);

  return {
    isMiniPay,
    isConnected,
    address,
    /** Hide the manual connect button when inside MiniPay */
    hideConnectBtn: isMiniPay,
  };
}
