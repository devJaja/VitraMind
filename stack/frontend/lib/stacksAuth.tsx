"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { showConnect, UserSession, AppConfig } from "@stacks/connect";
import { APP_DETAILS, NETWORK } from "@/lib/stacks";

const appConfig = new AppConfig(["store_write", "publish_data"]);
export const userSession = new UserSession({ appConfig });

interface StacksAuthCtx {
  isConnected: boolean;
  stxAddress: string | null;
  connect: () => void;
  disconnect: () => void;
}

const StacksAuthContext = createContext<StacksAuthCtx>({
  isConnected: false,
  stxAddress: null,
  connect: () => {},
  disconnect: () => {},
});

export function StacksAuthProvider({ children }: { children: React.ReactNode }) {
  const [stxAddress, setStxAddress] = useState<string | null>(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      const addr = NETWORK === "mainnet"
        ? data.profile.stxAddress.mainnet
        : data.profile.stxAddress.testnet;
      setStxAddress(addr);
    }
  }, []);

  const connect = useCallback(() => {
    showConnect({
      appDetails: APP_DETAILS,
      userSession,
      onFinish: () => {
        const data = userSession.loadUserData();
        const addr = NETWORK === "mainnet"
          ? data.profile.stxAddress.mainnet
          : data.profile.stxAddress.testnet;
        setStxAddress(addr);
      },
    });
  }, []);

  const disconnect = useCallback(() => {
    userSession.signUserOut();
    setStxAddress(null);
  }, []);

  return (
    <StacksAuthContext.Provider value={{ isConnected: !!stxAddress, stxAddress, connect, disconnect }}>
      {children}
    </StacksAuthContext.Provider>
  );
}

export function useStacksAuth() {
  return useContext(StacksAuthContext);
}
