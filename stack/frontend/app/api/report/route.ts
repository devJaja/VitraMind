import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const rl = new Map<string, { count: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const e = rl.get(ip);
  if (!e || now > e.reset) { rl.set(ip, { count: 1, reset: now + 60_000 }); return false; }
  if (e.count >= 10) return true;
  e.count++; return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Gemini not configured" }, { status: 500 });

  const { logs, streak, proofCount } = await req.json();
  if (!logs?.length) return NextResponse.json({ error: "No logs provided" }, { status: 400 });

  const ctx = logs.slice(-30).map((l: { mood: number; habits: string; reflection: string; date: string }, i: number) =>
    `Entry ${i + 1} (${l.date}): Mood ${l.mood}/5 | Habits: ${l.habits || "none"} | Reflection: ${l.reflection || "none"}`
  ).join("\n");

  const prompt = `You are a personal growth analyst. Analyze this user's journal data:

${ctx}

Stats: ${streak}-day streak, ${proofCount} on-chain proofs.

Provide a structured growth report with:
**Consistency Score** — Rate 1-10 with brief reasoning.
**Mood Trend** — Direction and key drivers (2 sentences).
**Top Habit** — Their most consistent habit and its impact.
**Growth Velocity** — Are they accelerating or plateauing? (1-2 sentences).
**Next Level Action** — One specific high-leverage change for the next 14 days.

Under 250 words. Be data-driven and specific.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return NextResponse.json({ report: result.response.text() });
  } catch {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
