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
      // Only connect if not already connected (e.g. after page refresh)
      if (!isConnected) {
        connect({ connector: injected() });
      }
    }
  // connect is stable from wagmi; isConnected intentionally omitted to run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isMiniPay,
    isConnected,
    address,
    /** Hide the manual connect button when inside MiniPay */
    hideConnectBtn: isMiniPay,
  };
}
