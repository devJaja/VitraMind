"use client";

import { useCallback } from "react";
import { useWalletClient, useChainId } from "wagmi";
import { encodeFunctionData, type Abi } from "viem";

// cUSD address per chain — used as feeCurrency so MiniPay pays gas in cUSD
const CUSD: Record<number, `0x${string}`> = {
  44787: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Alfajores
  42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // Celo mainnet
};

/**
 * useMiniPayCUSD
 *
 * MiniPay requires transactions to specify `feeCurrency` so gas is paid
 * in cUSD rather than CELO. This hook wraps sendTransaction to inject
 * that field automatically when running inside MiniPay.
 *
 * Outside MiniPay it falls back to a plain sendTransaction with no feeCurrency.
 */
export function useMiniPayCUSD() {
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const isMiniPay =
    typeof window !== "undefined" &&
    !!(window.ethereum as { isMiniPay?: boolean } | undefined)?.isMiniPay;

  const writeContract = useCallback(
    async <TAbi extends Abi>({
      address,
      abi,
      functionName,
      args,
    }: {
      address: `0x${string}`;
      abi: TAbi;
      functionName: string;
      args: unknown[];
    }): Promise<`0x${string}`> => {
      if (!walletClient) throw new Error("Wallet not connected");

      const data = encodeFunctionData({
        abi,
        functionName,
        args,
      } as Parameters<typeof encodeFunctionData>[0]);

      const tx = {
        to: address,
        data,
        ...(isMiniPay && CUSD[chainId] ? { feeCurrency: CUSD[chainId] } : {}),
      };

      return walletClient.sendTransaction(
        tx as Parameters<typeof walletClient.sendTransaction>[0]
      );
    },
    [walletClient, isMiniPay, chainId]
  );

  return { writeContract, isMiniPay };
}
