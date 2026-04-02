import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-2.5-flash";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

/**
 * POST /api/ask-ai
 * Body: { name, address, type, mode, previousBrief? }
 * Returns: { text: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { name, address, type, mode, previousBrief } = body as {
      name: string;
      address: string;
      type: string;
      mode: "brief" | "detailed";
      previousBrief?: string;
    };

    if (!name) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const briefPrompt = `You are a pitch coach for Gillman Services, a construction staffing company in Tampa, FL. A veteran field sales rep is about to walk into this business. They already know what the business does — don't explain it to them. They need angles and intel.

Business: ${name}
Location: ${address || "Tampa area, FL"}
Industry: ${type || "Construction/Trade"}

Give exactly this, nothing else:

🎯 **Your angle** — One specific pain point this type of business likely has that Gillman solves. Be concrete (e.g. "They probably lose guys to bigger GCs mid-project" not "They may need staffing help"). 1-2 sentences max.

📋 **Quick intel** — Estimate what you can: approximate crew size, typical pay range for their trade in the Tampa market, how long they've likely been operating if known, and whether they're likely union or non-union. Don't guess wildly — only include what's reasonable to infer. 2-3 sentences.

💡 **Insider tip** — One piece of industry-specific knowledge about this trade that makes the rep sound like they understand the business. Could be seasonal patterns, common project pain, permit/inspection bottlenecks, supply chain issues, whatever is most relevant. 1-2 sentences.

No fluff, no intros, no "Here's your briefing" — just the three bullets. Under 150 words total.`;

    const detailedPrompt = `You are a sales intelligence researcher for Gillman Services, a construction staffing company in Tampa, FL. A field rep already got a quick pitch angle for this business and now wants deeper intel.

Business: ${name}
Location: ${address || "Tampa area, FL"}
Industry: ${type || "Construction/Trade"}

Previous briefing the rep already has:
${previousBrief || "(No previous briefing)"}

Now provide ADDITIONAL detail they don't already have. Include:

📊 **Company profile** — Estimated crew size, years in business if inferable, whether they're likely union or open shop, and approximate pay range for their core trade in the Tampa market.

🔍 **Recent activity** — Any signals of growth, new projects, hiring, or challenges this type of company in this market would be facing right now.

🤝 **Decision maker** — Who typically makes staffing decisions at this type of company (owner, project manager, superintendent, office manager) and the best way to get to them.

🏆 **Competitive landscape** — Who else is likely calling on them for staffing, and what makes Gillman's pitch different.

Do NOT repeat anything from the previous briefing. Under 300 words. No intros or fluff.`;

    const prompt = mode === "detailed" ? detailedPrompt : briefPrompt;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const text = response.text ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[ask-ai] Gemini API error:", err);
    return NextResponse.json(
      { error: "Failed to generate AI brief. Please try again." },
      { status: 500 },
    );
  }
}
