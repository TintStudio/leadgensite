import { z } from "zod";
import { openAIAdapter } from "./providers/openai";
import { openRouterAdapter } from "./providers/openrouter";
import { AICompletionMessage } from "./providers/types";

export interface UserAICredentials {
  provider: "openai" | "openrouter";
  apiKey: string;
  model: string;
}

/**
 * Strips markdown code blocks (e.g. ```json ... ```) and leading/trailing whitespace.
 */
export function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();

  // Remove markdown code fences if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  return cleaned.trim();
}

/**
 * Executes an AI generation request using the user's decrypted BYOK key,
 * and validates the resulting JSON against a Zod schema with up to 2 retries.
 */
export async function generateStructuredContent<T>(
  credentials: UserAICredentials,
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  maxRetries = 2
): Promise<T> {
  const adapter =
    credentials.provider === "openrouter" ? openRouterAdapter : openAIAdapter;

  const currentSystemPrompt = systemPrompt;
  let currentUserPrompt = userPrompt;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const messages: AICompletionMessage[] = [
        { role: "system", content: currentSystemPrompt },
        { role: "user", content: currentUserPrompt },
      ];

      const result = await adapter.complete(credentials.apiKey, {
        model: credentials.model,
        messages,
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const cleaned = cleanJsonString(result.content);
      const parsed = JSON.parse(cleaned);
      const validated = schema.parse(parsed);

      return validated;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      lastError = new Error(`Attempt ${attempt + 1} failed: ${errorMsg}`);

      // If validation or parsing failed, refine prompt for retry
      if (attempt < maxRetries) {
        currentUserPrompt = `${userPrompt}\n\nIMPORTANT: Your previous output failed with error: "${errorMsg}". Please return ONLY valid JSON matching the exact schema requirements without extra formatting or markdown fences.`;
      }
    }
  }

  throw lastError || new Error("Failed to generate and validate structured content");
}
