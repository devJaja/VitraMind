"use client";

import { useState } from "react";
import { useStacksAuth } from "@/lib/stacksAuth";
import { getLogs, exportLogs } from "@/lib/logStorage";

interface Step { title: string; body: string; emoji: string; }

const STEPS: Step[] = [
  { emoji: "🌱", title: "Welcome to VitraMind", body: "Your privacy-first growth companion. Track habits, moods, and reflections — with cryptographic proofs anchored on Bitcoin via Stacks." },
  { emoji: "🔒", title: "Your data stays yours", body: "Raw journal entries never touch the blockchain. Only SHA-256 hashes are committed on-chain — giving you verifiable proof without exposing personal data." },
  { emoji: "🤖", title: "AI-powered insights", body: "After 3+ entries, Google Gemini analyzes your patterns and generates personalized insights, predictions, and a letter from your future self." },
  { emoji: "🔥", title: "Earn streak rewards", body: "Maintain daily habits to build streaks. Hit 7, 30, or 100 days to unlock STX rewards from the on-chain Reward Vault." },
  { emoji: "🎯", title: "Set verifiable goals", body: "Commit goal hashes on-chain. Update their status as you progress. Your goals are private — only the commitment proof is public." },
  { emoji: "✅", title: "You're ready!", body: "Connect your Stacks wallet to start your first log. Your growth journey begins now." },
];

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5">
        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-orange-500" : "w-1.5 bg-gray-700"}`} />
          ))}
        </div>
        <div className="text-center space-y-3">
          <p className="text-5xl">{cur.emoji}</p>
          <h2 className="text-lg font-bold text-white">{cur.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{cur.body}</p>
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 rounded-xl text-sm transition-all">
              Back
            </button>
          )}
          <button onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-black font-bold py-2.5 rounded-xl text-sm transition-all">
            {isLast ? "Get Started 🚀" : "Next"}
          </button>
        </div>
        {!isLast && (
          <button onClick={onComplete} className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}

export function useOnboarding() {
  const KEY = "vitramind_onboarding_done";
  const [show, setShow] = useState(() => typeof window !== "undefined" && !localStorage.getItem(KEY));
  function complete() { localStorage.setItem(KEY, "1"); setShow(false); }
  return { show, complete };
}
