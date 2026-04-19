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

export function createLogEntry(mood: number, habits: string, reflection: string): LogEntry {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    date: new Date().toISOString(),
    mood,
    habits,
    reflection,
  };
}
