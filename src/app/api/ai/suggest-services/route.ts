import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAICredentials } from "@/lib/ai/user-credentials";
import { generateStructuredContent } from "@/lib/ai/generate";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const ServicesOutputSchema = z.object({
  services: z.array(z.string()).min(3).max(10),
});

export async function POST(request: Request) {
  try {
    const { credentials, error } = await getUserAICredentials();
    const body = await request.json();

    const businessName = body.business_name || "Local Business";
    const niche = body.service_type || body.niche || "Restoration";

    if (error || !credentials) {
      // Smart local fallback if no key set
      const defaultServices = [
        "Emergency Water Extraction",
        "Flood Damage Cleanup",
        "Basement Water Removal",
        "Burst Pipe Repair",
        "Structural Drying",
        "Mold Remediation",
      ];
      return NextResponse.json({
        services: defaultServices,
        notice: "Using standard service list. Configure your AI API key in Settings for dynamic AI generation.",
      });
    }

    const prompt = `Generate the top 5 to 8 high-demand, high-converting commercial and residential service offerings for a business in this trade:
- Business Name: ${businessName}
- Industry / Niche: ${niche}

Return a JSON object with:
- "services": An array of service titles (e.g. ["Water Damage Restoration", "Emergency Water Extraction", "Flood Damage Repair"])`;

    const result = await generateStructuredContent(
      credentials,
      DEFAULT_SYSTEM_PROMPT,
      prompt,
      ServicesOutputSchema
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to suggest services" },
      { status: 500 }
    );
  }
}
