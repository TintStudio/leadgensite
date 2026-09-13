import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAICredentials } from "@/lib/ai/user-credentials";
import { generateStructuredContent } from "@/lib/ai/generate";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const BlogsOutputSchema = z.object({
  blog_titles: z.array(z.string()).min(3).max(8),
});

export async function POST(request: Request) {
  try {
    const { credentials, error } = await getUserAICredentials();
    const body = await request.json();

    const niche = body.service_type || body.niche || "Water Damage Restoration";
    const city = body.city || "Local Area";

    if (error || !credentials) {
      return NextResponse.json({
        blog_titles: [
          `Top 5 Warning Signs of Hidden Water Leaks in ${city} Homes`,
          `What to Do in the First 60 Minutes After a Pipe Burst`,
          `How Seasonal Weather Impacts Property Damage in ${city}`,
          `Does Homeowners Insurance Cover Emergency Flood Cleanup?`,
          `A Complete Guide to Preventing Basement Flooding`,
        ],
        notice: "Using standard blog topics. Configure your AI API key in Settings for AI topic generation.",
      });
    }

    const prompt = `Generate 5 to 6 engaging, high-intent Local SEO informational blog post titles for:
- Trade / Niche: ${niche}
- Primary City: ${city}

The topics must answer urgent homeowner questions, help with insurance claims, or guide emergency prevention.

Return a JSON object with:
- "blog_titles": An array of strings`;

    const result = await generateStructuredContent(
      credentials,
      DEFAULT_SYSTEM_PROMPT,
      prompt,
      BlogsOutputSchema
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to suggest blog titles" },
      { status: 500 }
    );
  }
}
