import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-2.5-flash";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

/**
 * POST /api/ask-ai
 * Body: { name: string, address: string, type: string, mode: "brief" | "detailed" }
 * Returns: { text: string }
 *
 * Server-side only — GEMINI_API_KEY never exposed to browser.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { name, address, type, mode } = body as {
      name: string;
      address: string;
      type: string;
      mode: "brief" | "detailed";
    };

    if (!name) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const briefPrompt = `You are a field sales research assistant for a construction staffing company. Generate a concise sales brief for approaching this business:

Business: ${name}
Address: ${address || "Unknown"}
Industry: ${type || "Construction/Trade"}

Provide:
1. **Angle** — One pain point relevant to construction staffing that this business likely faces
2. **Quick Intel** — Estimated crew size, typical pay ranges for their trade, union vs non-union likelihood
3. **Insider Tip** — One trade-specific insight that would impress them in a cold call

Keep it under 150 words. Be specific to their trade, not generic.`;

    const detailedPrompt = `You are a field sales research assistant for a construction staffing company. Generate a detailed sales research brief for this business:

Business: ${name}
Address: ${address || "Unknown"}
Industry: ${type || "Construction/Trade"}

Provide:
1. **Sales Angle** — Key pain point for their specific trade regarding staffing
2. **Quick Intel** — Crew size estimates, pay ranges, union status, seasonal patterns
3. **Insider Tip** — Trade-specific knowledge to build credibility
4. **Company Profile** — What a company like this typically does, their clients, project types
5. **Decision Maker** — Who typically makes staffing decisions (owner, PM, superintendent)
6. **Competitive Landscape** — Other staffing companies likely serving this trade in the area
7. **Conversation Starters** — 2-3 specific questions to open a cold call

Keep it under 300 words. Be specific and actionable.`;

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
