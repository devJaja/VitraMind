import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Simple in-memory rate limiter: max 20 req/min per IP
const rl = new Map<string, { count: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const e = rl.get(ip);
  if (!e || now > e.reset) { rl.set(ip, { count: 1, reset: now + 60_000 }); return false; }
  if (e.count >= 20) return true;
  e.count++; return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Gemini not configured" }, { status: 500 });

  const { goalText, logs } = await req.json();
  if (!goalText) return NextResponse.json({ error: "goalText required" }, { status: 400 });

  const ctx = logs?.slice(-10).map((l: { mood: number; habits: string; date: string }) =>
    `${l.date}: Mood ${l.mood}/5, Habits: ${l.habits || "none"}`
  ).join("\n") ?? "";

  const prompt = `You are a personal growth coach. A user has set this goal: "${goalText}"

${ctx ? `Their recent journal context:\n${ctx}\n\n` : ""}Give a concise (3-4 sentences) actionable breakdown:
1. Why this goal matters
2. One concrete first step to take today
3. A measurable 30-day milestone

Be specific and encouraging. Under 120 words.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return NextResponse.json({ coaching: result.response.text() });
  } catch {
    return NextResponse.json({ error: "Failed to generate coaching" }, { status: 500 });
  }
}
