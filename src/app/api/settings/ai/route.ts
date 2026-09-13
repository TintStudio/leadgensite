import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptApiKey } from "@/lib/crypto";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, apiKey, model } = await request.json();

    if (!provider || !["openai", "openrouter"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'openai' or 'openrouter'" },
        { status: 400 }
      );
    }

    // Encrypt the API key before storing in Supabase
    const encryptedKey = apiKey ? encryptApiKey(apiKey.trim()) : null;

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        ai_provider: provider,
        ai_api_key_encrypted: encryptedKey,
        ai_model: model || (provider === "openai" ? "gpt-4o-mini" : "openai/gpt-4o-mini"),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
