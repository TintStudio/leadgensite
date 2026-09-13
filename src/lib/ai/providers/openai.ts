import { AICompletionOptions, AICompletionResult, AIProviderAdapter } from "./types";

export class OpenAIAdapter implements AIProviderAdapter {
  async complete(apiKey: string, options: AICompletionOptions): Promise<AICompletionResult> {
    if (!apiKey) {
      throw new Error("OpenAI API key is missing");
    }

    const payload: Record<string, unknown> = {
      model: options.model || "gpt-4o-mini",
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
    };

    if (options.response_format) {
      payload.response_format = options.response_format;
    }

    if (options.max_tokens) {
      payload.max_tokens = options.max_tokens;
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMessage = `OpenAI API error (${res.status})`;
      try {
        const errorData = await res.json();
        errorMessage = errorData?.error?.message || errorMessage;
      } catch {
        // Fallback to generic status
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";

    return {
      content,
      usage: data?.usage,
    };
  }
}

export const openAIAdapter = new OpenAIAdapter();
