import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAICredentials } from "@/lib/ai/user-credentials";
import { generateStructuredContent } from "@/lib/ai/generate";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const KeywordsOutputSchema = z.object({
  target_keyword: z.string(),
  secondary_keywords: z.array(z.string()).min(3).max(12),
});

export async function POST(request: Request) {
  try {
    const { credentials, error } = await getUserAICredentials();
    const body = await request.json();

    const businessName = body.business_name || "Local Business";
    const niche = body.service_type || body.niche || "Professional Services";
    const city = body.city || "Local";
    const state = body.state || "";

    // If user has not configured BYOK key, provide a smart fallback
    if (error || !credentials) {
      const loc = city.toLowerCase();
      const n = niche.toLowerCase();
      return NextResponse.json({
        target_keyword: `${n} ${loc}`,
        secondary_keywords: [
          `emergency ${n} ${loc}`,
          `best ${n} near me`,
          `licensed ${n} contractors`,
          `affordable ${n} service`,
          `residential and commercial ${n}`,
        ],
        notice: "Generated using local pattern. Configure your AI API key in Settings for AI-powered suggestions.",
      });
    }

    const prompt = `Analyze this local business and generate high-intent Local SEO keywords:
- Business Name: ${businessName}
- Industry / Niche: ${niche}
- City & State: ${city}, ${state}

Return a JSON object with:
- "target_keyword": Exactly 1 primary high-volume local search phrase (e.g. "water damage restoration arvada")
- "secondary_keywords": An array of 6 to 10 supporting long-tail, semantic, and transactional search terms.`;

    const result = await generateStructuredContent(
      credentials,
      DEFAULT_SYSTEM_PROMPT,
      prompt,
      KeywordsOutputSchema
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to suggest keywords" },
      { status: 500 }
    );
  }
}
