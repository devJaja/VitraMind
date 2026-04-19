"use client";

import { useEffect, useState } from "react";
import { useConnect, useAccount } from "wagmi";

export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected, address } = useAccount();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.ethereum &&
      (window.ethereum as { isMiniPay?: boolean }).isMiniPay
    ) {
      setIsMiniPay(true);
      if (!isConnected) {
        // Use the registered "minipay" connector from wagmi config — not a new
        // injected() instance, which would have a mismatched ID and silently fail
        const miniPay = connectors.find((c) => c.id === "minipay");
        if (miniPay) connect({ connector: miniPay }, { onError: () => {} });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isMiniPay, isConnected, address, hideConnectBtn: isMiniPay };
}
