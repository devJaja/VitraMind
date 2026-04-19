import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

type LogEntry = { mood: number; habits: string; reflection: string; date: string };

function buildContext(logs: LogEntry[]) {
  return logs.slice(-30).map((l, i) =>
    `Entry ${i + 1} (${l.date}): Mood ${l.mood}/5 | Habits: ${l.habits || "none"} | Reflection: ${l.reflection || "none"}`
  ).join("\n");
}

const PROMPTS = {
  // Called after every log submission
  full_insight: (ctx: string) => `You are a warm, insightful personal growth coach.

Journal entries:
${ctx}

Respond with exactly these 4 sections (use **bold** headers):
**Pattern Analysis** — 2-3 sentences on mood and habit trends.
**Habit Suggestions** — 2-3 specific, actionable improvements.
**30-Day Prediction** — 1-2 sentences on where they're headed if they continue.
**Letter from Future Self** — 3-4 sentences, personal and motivating, written as if from their future self.

Be specific to their actual data. Under 300 words total.`,

  // Quick mood check after single entry
  quick_check: (ctx: string) => `You are a supportive growth coach. Based on this journal entry:
${ctx}

Give a brief (2-3 sentence) warm, encouraging response acknowledging their mood and habits today. Be specific, not generic.`,

  // On-demand question answering
  ask: (ctx: string, question: string) => `You are a personal growth coach with access to someone's journal.

Their journal entries:
${ctx}

They ask: "${question}"

Answer directly and specifically based on their actual journal data. Be concise (under 150 words), warm, and actionable.`,

  // Weekly summary
  weekly_summary: (ctx: string) => `You are a personal growth coach. Summarize this person's week based on their journal:
${ctx}

Provide:
**Weekly Summary** — Overall mood trend and consistency (2 sentences).
**Top Win** — Their biggest positive pattern this week (1 sentence).
**Focus for Next Week** — One specific thing to improve (1-2 sentences).

Under 150 words.`,
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const body = await req.json() as {
      logs: LogEntry[];
      mode?: "full_insight" | "quick_check" | "ask" | "weekly_summary";
      question?: string;
    };

    const { logs, mode = "full_insight", question } = body;
    if (!logs?.length) return NextResponse.json({ error: "No logs provided" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const ctx = buildContext(logs);

    let prompt: string;
    if (mode === "ask") {
      if (!question) return NextResponse.json({ error: "Question required for ask mode" }, { status: 400 });
      prompt = PROMPTS.ask(ctx, question);
    } else if (mode === "quick_check") {
      prompt = PROMPTS.quick_check(ctx);
    } else if (mode === "weekly_summary") {
      prompt = PROMPTS.weekly_summary(ctx);
    } else {
      prompt = PROMPTS.full_insight(ctx);
    }

    const result = await model.generateContent(prompt);
    const insight = result.response.text();

    return NextResponse.json({ insight });
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
