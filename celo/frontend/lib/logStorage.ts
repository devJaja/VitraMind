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
