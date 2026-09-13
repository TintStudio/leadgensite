import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";
import { decryptApiKey, maskApiKey } from "@/lib/crypto";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProvider: "openai" | "openrouter" | null = null;
  let initialModel: string | null = null;
  let hasExistingKey = false;
  let maskedKeyPreview = "";
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, ai_provider, ai_api_key_encrypted, ai_model")
      .eq("id", user.id)
      .maybeSingle<{
        role: "user" | "admin";
        ai_provider: "openai" | "openrouter" | null;
        ai_api_key_encrypted: string | null;
        ai_model: string | null;
      }>();

    if (profile) {
      isAdmin = profile.role === "admin";
      initialProvider = profile.ai_provider;
      initialModel = profile.ai_model;
      if (profile.ai_api_key_encrypted) {
        hasExistingKey = true;
        const decrypted = decryptApiKey(profile.ai_api_key_encrypted);
        maskedKeyPreview = maskApiKey(decrypted);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your AI generation provider credentials and system preferences.
        </p>
      </div>

      <SettingsForm
        isAdmin={isAdmin}
        initialProvider={initialProvider}
        initialModel={initialModel}
        hasExistingKey={hasExistingKey}
        maskedKeyPreview={maskedKeyPreview}
      />
    </div>
  );
}
