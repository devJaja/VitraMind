/**
 * Client-side analytics utilities.
 * All computations happen locally — no raw data leaves the device.
 */

import { getLogs, getMoodAverage, getLogStreak, getHabitFrequency } from "@/lib/logStorage";
import { buildAnalyticsDigest } from "@/lib/crypto";

export interface WeeklyAnalytics {
  weekStart: string;
  avgMood: number;
  logCount: number;
  topHabit: string | null;
  digestHash: string;
}

export interface MonthlyAnalytics {
  month: string;
  avgMood: number;
  logCount: number;
  streak: number;
  topHabits: string[];
  digestHash: string;
}

/** Compute weekly analytics digest for the last N weeks */
export function computeWeeklyAnalytics(address: string, weeks = 4): WeeklyAnalytics[] {
  const logs = getLogs(address);
  const result: WeeklyAnalytics[] = [];

  for (let w = 0; w < weeks; w++) {
    const weekEnd   = Date.now() - w * 7 * 86400000;
    const weekStart = weekEnd - 7 * 86400000;
    const weekLogs  = logs.filter(l => {
      const t = new Date(l.date).getTime();
      return t >= weekStart && t < weekEnd;
    });

    const moods = weekLogs.map(l => l.mood);
    const avgMood = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : 0;
    const habitFreq = getHabitFrequency(address, 7);
    const topHabit = Object.entries(habitFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const digestHash = buildAnalyticsDigest(address, moods, "weekly");

    result.push({
      weekStart: new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      avgMood,
      logCount: weekLogs.length,
      topHabit,
      digestHash,
    });
  }

  return result;
}

/** Compute monthly analytics digest */
export function computeMonthlyAnalytics(address: string): MonthlyAnalytics {
  const logs = getLogs(address);
  const cutoff = Date.now() - 30 * 86400000;
  const monthLogs = logs.filter(l => new Date(l.date).getTime() > cutoff);
  const moods = monthLogs.map(l => l.mood);
  const avgMood = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : 0;
  const habitFreq = getHabitFrequency(address, 30);
  const topHabits = Object.entries(habitFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h]) => h);
  const digestHash = buildAnalyticsDigest(address, moods, "monthly");

  return {
    month: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    avgMood,
    logCount: monthLogs.length,
    streak: getLogStreak(address),
    topHabits,
    digestHash,
  };
}
