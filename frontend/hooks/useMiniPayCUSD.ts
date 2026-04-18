"use client";

import { useCallback } from "react";
import { useWalletClient, useChainId, useSwitchChain } from "wagmi";
import { encodeFunctionData, type Abi } from "viem";
import { celo } from "wagmi/chains";

const CUSD: Record<number, `0x${string}`> = {
  44787: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
};

export function useMiniPayCUSD() {
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

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

      // Auto-switch to Celo mainnet if on wrong network
      if (chainId !== celo.id && chainId !== 44787) {
        await switchChainAsync({ chainId: celo.id });
      }

      if (isMiniPay && CUSD[chainId]) {
        // MiniPay path: inject feeCurrency for cUSD gas
        const data = encodeFunctionData({ abi, functionName, args } as Parameters<typeof encodeFunctionData>[0]);
        return walletClient.sendTransaction({
          to: address,
          data,
          feeCurrency: CUSD[chainId],
        } as Parameters<typeof walletClient.sendTransaction>[0]);
      }

      // Standard browser wallet path — writeContract handles gas estimation
      return walletClient.writeContract({
        address,
        abi,
        functionName,
        args,
      } as Parameters<typeof walletClient.writeContract>[0]);
    },
    [walletClient, isMiniPay, chainId, switchChainAsync]
  );

  return { writeContract, isMiniPay };
}
