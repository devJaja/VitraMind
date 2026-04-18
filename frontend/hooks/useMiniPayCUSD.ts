"use client";

import { useCallback } from "react";
import { useChainId, useSwitchChain } from "wagmi";
import { getWalletClient } from "wagmi/actions";
import { encodeFunctionData, type Abi } from "viem";
import { celo } from "wagmi/chains";
import { wagmiConfig } from "@/lib/wagmi";

const CUSD: Record<number, `0x${string}`> = {
  44787: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
};

export function useMiniPayCUSD() {
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
      // Fetch walletClient at call time — avoids undefined on first render
      const walletClient = await getWalletClient(wagmiConfig);
      if (!walletClient) throw new Error("Wallet not connected");

      // Switch to Celo if on wrong network
      const currentChain = walletClient.chain?.id ?? chainId;
      if (currentChain !== celo.id && currentChain !== 44787) {
        await switchChainAsync({ chainId: celo.id });
      }

      if (isMiniPay && CUSD[currentChain]) {
        const data = encodeFunctionData({ abi, functionName, args } as Parameters<typeof encodeFunctionData>[0]);
        return walletClient.sendTransaction({
          to: address, data, feeCurrency: CUSD[currentChain],
        } as Parameters<typeof walletClient.sendTransaction>[0]);
      }

      return walletClient.writeContract({
        address, abi, functionName, args,
        chain: walletClient.chain,
      } as Parameters<typeof walletClient.writeContract>[0]);
    },
    [isMiniPay, chainId, switchChainAsync]
  );

  return { writeContract, isMiniPay };
}
