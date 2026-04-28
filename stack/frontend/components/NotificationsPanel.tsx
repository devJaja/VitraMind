"use client";

import { useState, useEffect } from "react";
import { getLogs, getLogStreak, getMoodAverage } from "@/lib/logStorage";

export interface Notification {
  id: string;
  type: "streak" | "insight" | "milestone" | "tip";
  title: string;
  body: string;
  read: boolean;
  ts: number;
}

function storageKey(addr: string) { return `vitramind_notifications_${addr.toLowerCase()}`; }

function load(addr: string): Notification[] {
  try { return JSON.parse(localStorage.getItem(storageKey(addr)) ?? "[]"); } catch { return []; }
}

function save(addr: string, items: Notification[]) {
  localStorage.setItem(storageKey(addr), JSON.stringify(items));
}

function generate(addr: string): Notification[] {
  const streak = getLogStreak(addr);
  const moodAvg = getMoodAverage(addr, 7);
  const logs = getLogs(addr);
  const now = Date.now();
  const notes: Notification[] = [];

  if (streak >= 100) notes.push({ id: "streak-100", type: "milestone", title: "🌟 100-Day Legend!", body: "Claim your 10 STX reward in the Reward Vault.", read: false, ts: now });
  else if (streak >= 30) notes.push({ id: "streak-30", type: "milestone", title: "🏆 30-Day Streak!", body: "Claim your 2 STX milestone reward.", read: false, ts: now });
  else if (streak >= 7) notes.push({ id: "streak-7", type: "milestone", title: "🔥 7-Day Streak!", body: "A 0.5 STX reward is waiting in the Reward Vault.", read: false, ts: now });

  if (logs.length === 3) notes.push({ id: "ai-unlock", type: "insight", title: "✨ AI Insights Unlocked", body: "Head to the AI tab for your first full insight.", read: false, ts: now });
  if (moodAvg > 0 && moodAvg < 2.5) notes.push({ id: "mood-low", type: "tip", title: "💙 Tough week?", body: "Your mood average is below 2.5. Try the AI coach for support.", read: false, ts: now });
  if (logs.length > 0 && streak === 0) notes.push({ id: "streak-broken", type: "streak", title: "⚡ Streak reset", body: "You missed a day. Start fresh today.", read: false, ts: now });

  return notes;
}

export function useNotifications(addr: string | null) {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (!addr) return;
    const stored = load(addr);
    const gen = generate(addr);
    const storedIds = new Set(stored.map(n => n.id));
    const merged = [...stored, ...gen.filter(n => !storedIds.has(n.id))];
    save(addr, merged);
    setItems(merged);
  }, [addr]);

  function markRead(id: string) {
    if (!addr) return;
    const updated = items.map(n => n.id === id ? { ...n, read: true } : n);
    save(addr, updated); setItems(updated);
  }
  function markAllRead() {
    if (!addr) return;
    const updated = items.map(n => ({ ...n, read: true }));
    save(addr, updated); setItems(updated);
  }
  function dismiss(id: string) {
    if (!addr) return;
    const updated = items.filter(n => n.id !== id);
    save(addr, updated); setItems(updated);
  }

  return { items, unreadCount: items.filter(n => !n.read).length, markRead, markAllRead, dismiss };
}

const TYPE_STYLES: Record<Notification["type"], string> = {
  streak:    "border-orange-800/40 bg-orange-950/30",
  insight:   "border-purple-800/40 bg-purple-950/30",
  milestone: "border-yellow-800/40 bg-yellow-950/30",
  tip:       "border-blue-800/40 bg-blue-950/30",
};

export function NotificationsPanel({ addr, onClose }: { addr: string; onClose: () => void }) {
  const { items, unreadCount, markRead, markAllRead, dismiss } = useNotifications(addr);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-sm max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <p className="text-sm font-semibold text-white">🔔 Notifications</p>
            {unreadCount > 0 && <p className="text-xs text-orange-400">{unreadCount} unread</p>}
          </div>
          <div className="flex gap-3 items-center">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Mark all read</button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-xs text-gray-500">All caught up!</p>
            </div>
          )}
          {items.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`rounded-xl p-3 border cursor-pointer transition-opacity ${TYPE_STYLES[n.type]} ${n.read ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.body}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                  className="text-gray-600 hover:text-gray-400 text-xs shrink-0">✕</button>
              </div>
              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
