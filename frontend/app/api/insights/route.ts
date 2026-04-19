import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(req: NextRequest) {
  try {
    const { logs } = await req.json() as {
      logs: Array<{ mood: number; habits: string; reflection: string; date: string }>;
    };

    if (!logs?.length) return NextResponse.json({ error: "No logs provided" }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const logSummary = logs.slice(-10).map((l, i) =>
      `Day ${i + 1} (${l.date}): Mood ${l.mood}/5, Habits: ${l.habits || "none"}, Reflection: ${l.reflection || "none"}`
    ).join("\n");

    const prompt = `You are a personal growth coach analyzing someone's habit and mood journal.

Here are their recent entries:
${logSummary}

Provide a concise, warm, and actionable response with exactly these 4 sections:
1. **Pattern Analysis** (2-3 sentences about mood and habit trends)
2. **Habit Suggestions** (2-3 specific improvements)
3. **30-Day Prediction** (1-2 sentences on where they're headed)
4. **Letter from Future Self** (3-4 sentences, personal and motivating)

Keep the total response under 300 words. Be specific, not generic.`;

    const result = await model.generateContent(prompt);
    const insight = result.response.text();

    return NextResponse.json({ insight });
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
