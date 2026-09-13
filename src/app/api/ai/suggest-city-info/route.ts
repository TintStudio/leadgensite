import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAICredentials } from "@/lib/ai/user-credentials";
import { generateStructuredContent } from "@/lib/ai/generate";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const CityInfoOutputSchema = z.object({
  city_info: z.string().min(30),
});

export async function POST(request: Request) {
  try {
    const { credentials, error } = await getUserAICredentials();
    const body = await request.json();

    const areaName = body.area_name || "Local Area";
    const state = body.state || "";
    const niche = body.service_type || body.niche || "local services";

    if (error || !credentials) {
      return NextResponse.json({
        city_info: `${areaName} is an active community located in ${state || "the region"}. Homeowners and commercial businesses in ${areaName} frequently require reliable, high-speed emergency ${niche} to protect properties from seasonal damage and plumbing infrastructure issues.`,
        notice: "Generated with local template. Add your AI API key in Settings for AI contextual city profiles.",
      });
    }

    const prompt = `Write a concise, authoritative local geographic profile (2 to 3 sentences) for:
- City/Area Name: ${areaName}
- State: ${state}
- Industry: ${niche}

Include local terrain/weather risks, community residential relevance, and why timely service dispatch is vital for ${areaName} property owners.

Return a JSON object with:
- "city_info": string`;

    const result = await generateStructuredContent(
      credentials,
      DEFAULT_SYSTEM_PROMPT,
      prompt,
      CityInfoOutputSchema
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to suggest city info" },
      { status: 500 }
    );
  }
}
