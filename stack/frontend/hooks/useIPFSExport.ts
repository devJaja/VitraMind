"use client";

import { useEffect, useState } from "react";
import { callReadOnlyFunction, cvToValue, principalCV } from "@stacks/transactions";
import { CONTRACTS, NETWORK } from "@/lib/contracts";
import { useStacksAuth } from "@/lib/stacksAuth";

const EXPORT_TYPES = ["FULL", "LOGS", "INSIGHTS", "ANALYTICS"] as const;

export function useIPFSExport() {
  const { stxAddress } = useStacksAuth();
  const [latestCID, setLatestCID]     = useState<string>();
  const [exportType, setExportType]   = useState<string>();
  const [exportedAt, setExportedAt]   = useState<number>();
  const [exportCount, setExportCount] = useState(0);

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
      const val = cvToValue(cv) as { value?: { cid?: string; "export-type"?: bigint; timestamp?: bigint } } | null;
      if (val?.value) {
        setLatestCID(val.value.cid);
        setExportType(EXPORT_TYPES[Number(val.value["export-type"] ?? 0)]);
        setExportedAt(Number(val.value.timestamp ?? 0));
      }
    }).catch(() => {});
  }, [stxAddress]);

  return { latestCID, exportType, exportedAt, exportCount };
}
