export interface LogEntry {
  id: string;
  date: string;         // ISO date string
  mood: number;         // 1-5
  habits: string;
  reflection: string;
  insight?: string;     // Gemini response
  logTxHash?: string;   // on-chain proof tx
  insightTxHash?: string;
}

function storageKey(address: string) {
  return `vitramind_logs_${address.toLowerCase()}`;
}

export function getLogs(address: string): LogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(address)) ?? "[]");
  } catch { return []; }
}

export function saveLog(address: string, entry: LogEntry): void {
  if (typeof window === "undefined") return;
  const logs = getLogs(address);
  const idx = logs.findIndex(l => l.id === entry.id);
  if (idx >= 0) logs[idx] = entry;
  else logs.push(entry);
  localStorage.setItem(storageKey(address), JSON.stringify(logs));
}

export function deleteLog(address: string, id: string): void {
  if (typeof window === "undefined") return;
  const logs = getLogs(address).filter(l => l.id !== id);
  localStorage.setItem(storageKey(address), JSON.stringify(logs));
}

export function exportLogs(address: string): string {
  return JSON.stringify(getLogs(address), null, 2);
}

export function getLogStreak(address: string): number {
  const logs = getLogs(address);
  if (!logs.length) return 0;
  const dates = [...new Set(logs.map(l => l.date.slice(0, 10)))].sort().reverse();
  let streak = 0;
  let expected = new Date();
  for (const d of dates) {
    const diff = Math.round((expected.getTime() - new Date(d).getTime()) / 86400000);
    if (diff > 1) break;
    streak++;
    expected = new Date(d);
  }
  return streak;
}

export function getMoodAverage(address: string, days = 7): number {
  const cutoff = Date.now() - days * 86400000;
  const recent = getLogs(address).filter(l => new Date(l.date).getTime() > cutoff);
  if (!recent.length) return 0;
  return Math.round((recent.reduce((s, l) => s + l.mood, 0) / recent.length) * 10) / 10;
}

export function createLogEntry(mood: number, habits: string, reflection: string): LogEntry {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    date: new Date().toISOString(),
    mood,
    habits,
    reflection,
  };
}

/** Returns the longest streak ever recorded (not just current) */
export function getBestStreak(address: string): number {
  const logs = getLogs(address);
  if (!logs.length) return 0;
  const dates = [...new Set(logs.map(l => l.date.slice(0, 10)))].sort();
  let best = 1, current = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000);
    if (diff === 1) { current++; best = Math.max(best, current); }
    else current = 1;
  }
  return best;
}

/** Returns habit frequency map for the last N days */
export function getHabitFrequency(address: string, days = 30): Record<string, number> {
  const cutoff = Date.now() - days * 86400000;
  const logs = getLogs(address).filter(l => new Date(l.date).getTime() > cutoff);
  const freq: Record<string, number> = {};
  logs.forEach(l => {
    l.habits.split(",").map(h => h.trim().toLowerCase()).filter(Boolean).forEach(h => {
      freq[h] = (freq[h] ?? 0) + 1;
    });
  });
  return freq;
}

/** Returns mood distribution as percentages */
export function getMoodDistribution(address: string): Record<number, number> {
  const logs = getLogs(address);
  if (!logs.length) return {};
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  logs.forEach(l => { counts[l.mood] = (counts[l.mood] ?? 0) + 1; });
  const total = logs.length;
  return Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Math.round((v / total) * 100)]));
}

/** Returns total word count across all reflections */
export function getTotalReflectionWords(address: string): number {
  return getLogs(address).reduce((sum, l) => sum + (l.reflection?.split(/\s+/).filter(Boolean).length ?? 0), 0);
}
