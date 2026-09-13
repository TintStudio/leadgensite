"use client";

import { useState } from "react";
import { Key, Sparkles, Check, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModelOption {
  id: string;
  name: string;
  badge?: string;
  description: string;
}

const OPENAI_MODELS: ModelOption[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    badge: "Recommended",
    description: "Ultra-fast, cost-effective, excellent local SEO & JSON generation.",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    badge: "Flagship",
    description: "Highest reasoning, top-tier copywriting and nuance.",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "High accuracy and large context window.",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Legacy lightweight model for fast drafts.",
  },
];

const OPENROUTER_MODELS: ModelOption[] = [
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    badge: "Recommended",
    description: "OpenAI's efficient model routed through OpenRouter.",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    badge: "Best Copy",
    description: "World-class natural writing, high nuance and entity flow.",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    badge: "Open Source",
    description: "Extremely cost-effective, high quality open weights.",
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    badge: "Fastest",
    description: "Sub-second speed and sharp instruction following.",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    badge: "Budget",
    description: "Super low cost with strong structured output generation.",
  },
];

interface SettingsFormProps {
  isAdmin?: boolean;
  initialProvider?: "openai" | "openrouter" | null;
  initialModel?: string | null;
  hasExistingKey?: boolean;
  maskedKeyPreview?: string;
}

export function SettingsForm({
  isAdmin = false,
  initialProvider = "openai",
  initialModel = "gpt-4o-mini",
  hasExistingKey = false,
  maskedKeyPreview = "",
}: SettingsFormProps) {
  const [provider, setProvider] = useState<"openai" | "openrouter">(
    initialProvider || "openai"
  );
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(
    initialModel || (provider === "openai" ? "gpt-4o-mini" : "openai/gpt-4o-mini")
  );
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProviderChange = (newProvider: "openai" | "openrouter") => {
    setProvider(newProvider);
    if (newProvider === "openai") {
      setModel("gpt-4o-mini");
    } else {
      setModel("openai/gpt-4o-mini");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setIsSaved(false);

    try {
      const res = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim() || undefined,
          model,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to update settings");
        setSaving(false);
        return;
      }

      setIsSaved(true);
      setSaving(false);
      setApiKey(""); // Clear sensitive plaintext from UI state
    } catch {
      setError("An unexpected error occurred while saving your settings.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              AI Provider &amp; API Key
            </CardTitle>
            <Badge variant="outline" className="text-xs gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              {isAdmin ? "AES-256 Encrypted" : "Encrypted"}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {isAdmin ? (
              "Bring Your Own Key (BYOK). Your key is encrypted with military-grade AES-256-GCM before being stored in the database."
            ) : (
              "Your API key is encrypted and securely stored."
            )}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSaved && (
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>AI credentials updated and encrypted securely!</span>
              </div>
            )}

            {/* Provider Picker */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                AI Service Provider
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleProviderChange("openai")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    provider === "openai"
                      ? "border-primary ring-2 ring-primary/20 bg-muted/20 font-semibold"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm text-foreground">OpenAI</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Direct OpenAI API (GPT-4o, GPT-4o-mini)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderChange("openrouter")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    provider === "openrouter"
                      ? "border-primary ring-2 ring-primary/20 bg-muted/20 font-semibold"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm text-foreground">OpenRouter</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Unified multi-model API access
                  </p>
                </button>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="api_key" className="text-sm font-medium">
                  {provider === "openai" ? "OpenAI API Key" : "OpenRouter API Key"}
                </Label>
                {hasExistingKey && (
                  <span className="text-[11px] text-emerald-600 font-medium">
                    Active key configured ({maskedKeyPreview || "••••••••"})
                  </span>
                )}
              </div>
              <Input
                id="api_key"
                type="password"
                placeholder={hasExistingKey ? "Leave blank to keep existing key" : "sk-..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Your key is never exposed to client-side browsers and is decrypted only in isolated server functions.
              </p>
            </div>

            {/* AI Model Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="model-select" className="text-sm font-medium">
                  Select AI Model
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Current: <span className="font-mono font-medium text-foreground">{model}</span>
                </span>
              </div>

              {/* Predefined Models Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(provider === "openai" ? OPENAI_MODELS : OPENROUTER_MODELS).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModel(m.id)}
                    className={`p-2.5 rounded-md border text-left text-xs transition-colors flex flex-col justify-between ${
                      model === m.id
                        ? "border-primary bg-primary/10 font-semibold text-foreground ring-1 ring-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-foreground">{m.name}</span>
                      {m.badge && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1 font-mono truncate">
                      {m.id}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {m.description}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Model Input Option */}
              <div className="pt-2">
                <Label htmlFor="custom-model" className="text-xs text-muted-foreground">
                  Or enter custom model ID:
                </Label>
                <Input
                  id="custom-model"
                  placeholder={provider === "openai" ? "e.g. gpt-4o" : "e.g. anthropic/claude-3.5-sonnet"}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border pt-4">
            <Button type="submit" disabled={saving}>
              <Sparkles className="mr-2 h-4 w-4" />
              {saving ? "Encrypting & Saving..." : "Save API Settings"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
