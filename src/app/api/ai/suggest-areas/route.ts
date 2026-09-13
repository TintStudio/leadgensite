import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAICredentials } from "@/lib/ai/user-credentials";
import { generateStructuredContent } from "@/lib/ai/generate";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const AreasOutputSchema = z.object({
  areas: z.array(z.string()).min(3).max(12),
});

export async function POST(request: Request) {
  try {
    const { credentials, error } = await getUserAICredentials();
    const body = await request.json();

    const city = body.city || "Arvada";
    const state = body.state || "CO";

    if (error || !credentials) {
      return NextResponse.json({
        areas: [
          city,
          `North ${city}`,
          `Downtown ${city}`,
          `West ${city}`,
          `Olde Town ${city}`,
        ],
        notice: "Using standard area list. Configure your AI API key in Settings for AI geographic suggestions.",
      });
    }

    const prompt = `Identify the 5 to 8 most relevant neighboring towns, cities, suburbs, and major community areas surrounding:
- Primary City: ${city}
- State: ${state}

Return a JSON object with:
- "areas": An array of proper city/suburb names (e.g. ["${city}", "Westminster", "Wheat Ridge", "Golden", "Lakewood", "Broomfield"])`;

    const result = await generateStructuredContent(
      credentials,
      DEFAULT_SYSTEM_PROMPT,
      prompt,
      AreasOutputSchema
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to suggest areas" },
      { status: 500 }
    );
  }
}
