export interface AICompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  model: string;
  messages: AICompletionMessage[];
  temperature?: number;
  response_format?: { type: "json_object" };
  max_tokens?: number;
}

export interface AICompletionResult {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface AIProviderAdapter {
  complete(apiKey: string, options: AICompletionOptions): Promise<AICompletionResult>;
}
