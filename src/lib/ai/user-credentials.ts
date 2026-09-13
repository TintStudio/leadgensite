import { createClient } from "@/lib/supabase/server";
import { decryptApiKey } from "@/lib/crypto";
import { UserAICredentials } from "./generate";

export async function getUserAICredentials(): Promise<{
  credentials?: UserAICredentials;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("ai_provider, ai_api_key_encrypted, ai_model")
    .eq("id", user.id)
    .maybeSingle<{
      ai_provider: "openai" | "openrouter" | null;
      ai_api_key_encrypted: string | null;
      ai_model: string | null;
    }>();

  if (!profile || !profile.ai_api_key_encrypted) {
    return {
      error: "No AI API key found. Please configure your API key in Settings.",
    };
  }

  const decryptedKey = decryptApiKey(profile.ai_api_key_encrypted);
  if (!decryptedKey) {
    return {
      error: "Failed to decrypt your AI API key. Please re-enter it in Settings.",
    };
  }

  const provider = profile.ai_provider || "openai";
  const defaultModel = provider === "openai" ? "gpt-4o-mini" : "openai/gpt-4o-mini";

  return {
    credentials: {
      provider,
      apiKey: decryptedKey,
      model: profile.ai_model || defaultModel,
    },
  };
}
