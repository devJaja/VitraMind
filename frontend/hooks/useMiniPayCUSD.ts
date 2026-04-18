"use client";

import { useCallback } from "react";
import { useChainId, useSwitchChain } from "wagmi";
import { createWalletClient, custom, encodeFunctionData, type Abi } from "viem";
import { celo } from "wagmi/chains";

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
      if (!window.ethereum) throw new Error("No wallet found");

      // Switch to Celo first if needed
      if (chainId !== celo.id) {
        await switchChainAsync({ chainId: celo.id });
      }

      // Build a fresh viem walletClient bound to Celo — bypasses wagmi connector state
      const walletClient = createWalletClient({
        chain: celo,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transport: custom(window.ethereum as any),
      });

      const [account] = await walletClient.getAddresses();

      if (isMiniPay) {
        const data = encodeFunctionData({ abi, functionName, args } as Parameters<typeof encodeFunctionData>[0]);
        return walletClient.sendTransaction({
          account, to: address, data, feeCurrency: CUSD[celo.id],
        } as Parameters<typeof walletClient.sendTransaction>[0]);
      }

      return walletClient.writeContract({
        account, address, abi, functionName, args, chain: celo,
      } as Parameters<typeof walletClient.writeContract>[0]);
    },
    [isMiniPay, chainId, switchChainAsync]
  );

  return { writeContract, isMiniPay };
}
