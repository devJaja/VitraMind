"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

export function useIPFSExport() {
  const { stxAddress } = useStacksAuth();
  const [exportCount, setExportCount] = useState(0);
  const [latestCID, setLatestCID]     = useState<string>();
  const [exportType, setExportType]   = useState<string>();
  const [exportedAt, setExportedAt]   = useState<number>();

  useEffect(() => {
    if (!stxAddress) return;
    const [addr, name] = CONTRACTS.ipfsExportRegistry.split(".");

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "get-export-count",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => setExportCount(Number(cvToValue(cv) ?? 0))).catch(() => {});

    callReadOnlyFunction({
      contractAddress: addr, contractName: name,
      functionName: "latest-export",
      functionArgs: [principalCV(stxAddress)],
      network: NETWORK, senderAddress: stxAddress,
    }).then(cv => {
      const val = cvToValue(cv) as { value?: Record<string, unknown> } | null;
      if (val?.value) {
        setLatestCID(String(val.value["cid"] ?? ""));
        const TYPES = ["FULL", "LOGS", "INSIGHTS", "ANALYTICS"];
        setExportType(TYPES[Number(val.value["export-type"] ?? 0)]);
        setExportedAt(Number(val.value["timestamp"] ?? 0));
      }
    }).catch(() => {});
  }, [stxAddress]);

  return { exportCount, latestCID, exportType, exportedAt };
}
