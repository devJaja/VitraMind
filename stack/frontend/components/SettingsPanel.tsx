"use client";

import { useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";

type Theme = "dark" | "bitcoin" | "zen";
type FontSize = "sm" | "md" | "lg";

interface Settings {
  theme: Theme;
  fontSize: FontSize;
  showMoodChart: boolean;
  showHeatmap: boolean;
  aiAutoGenerate: boolean;
  notificationsEnabled: boolean;
}

const DEFAULTS: Settings = {
  theme: "dark",
  fontSize: "md",
  showMoodChart: true,
  showHeatmap: true,
  aiAutoGenerate: true,
  notificationsEnabled: true,
};

const STORAGE_KEY = "vitramind_settings";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") }; }
  catch { return DEFAULTS; }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { stxAddress, disconnect } = useStacksAuth();
  const [settings, setSettings] = useState<Settings>(loadSettings);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  }

  function clearData() {
    if (!stxAddress) return;
    if (!confirm("Delete all local logs and settings? This cannot be undone.")) return;
    localStorage.removeItem(`vitramind_logs_${stxAddress.toLowerCase()}`);
    localStorage.removeItem(`vitramind_notifications_${stxAddress.toLowerCase()}`);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("vitramind_onboarding_done");
    alert("Local data cleared.");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">⚙️ Settings</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {/* Theme */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Theme</p>
            <div className="flex gap-2">
              {(["dark", "bitcoin", "zen"] as Theme[]).map(t => (
                <button key={t} onClick={() => update("theme", t)}
                  className={`flex-1 text-xs py-2 rounded-xl font-medium capitalize transition-all ${settings.theme === t ? "bg-orange-500 text-black" : "bg-gray-800 text-gray-400"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Font Size</p>
            <div className="flex gap-2">
              {(["sm", "md", "lg"] as FontSize[]).map(f => (
                <button key={f} onClick={() => update("fontSize", f)}
                  className={`flex-1 text-xs py-2 rounded-xl font-medium uppercase transition-all ${settings.fontSize === f ? "bg-orange-500 text-black" : "bg-gray-800 text-gray-400"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Display</p>
            {([
              ["showMoodChart", "Show Mood Chart"],
              ["showHeatmap", "Show Activity Heatmap"],
              ["aiAutoGenerate", "Auto-generate AI insights"],
              ["notificationsEnabled", "Enable notifications"],
            ] as [keyof Settings, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <p className="text-sm text-gray-300">{label}</p>
                <button onClick={() => update(key, !settings[key] as Settings[typeof key])}
                  className={`w-10 h-5 rounded-full transition-colors relative ${settings[key] ? "bg-orange-500" : "bg-gray-700"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings[key] ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>

          {/* Danger zone */}
          <div className="border-t border-gray-800 pt-4 space-y-2">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Danger Zone</p>
            <button onClick={clearData}
              className="w-full bg-red-950/40 hover:bg-red-900/40 border border-red-900/40 text-red-400 font-semibold py-2 rounded-xl text-sm transition-all">
              Clear All Local Data
            </button>
            <button onClick={() => { disconnect(); onClose(); }}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold py-2 rounded-xl text-sm transition-all">
              Disconnect Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
