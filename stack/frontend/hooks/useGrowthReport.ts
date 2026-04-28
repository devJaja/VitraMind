"use client";

import { useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";
import { getLogs } from "@/lib/logStorage";
import { useProofRegistry } from "@/hooks/useProofRegistry";
import { useStreakVerifier } from "@/hooks/useStreakVerifier";

export function useGrowthReport() {
  const { stxAddress } = useStacksAuth();
  const { proofCount } = useProofRegistry();
  const { currentStreak } = useStreakVerifier();
  const [report, setReport] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function generate() {
    if (!stxAddress) return;
    const logs = getLogs(stxAddress).map(l => ({
      mood: l.mood, habits: l.habits,
      reflection: l.reflection,
      date: new Date(l.date).toLocaleDateString(),
    }));
    if (!logs.length) return;

    setLoading(true); setError(undefined);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs, streak: currentStreak, proofCount }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return { report, loading, error, generate };
}
