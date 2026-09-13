import { useState } from "react";
import { Plus, Trash2, Key, Sparkles, X, ListPlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WebsiteCreationFormData } from "@/types/create";

interface StepProps {
  data: WebsiteCreationFormData;
  updateData: (fields: Partial<WebsiteCreationFormData>) => void;
}

export function KeywordsStep({ data, updateData }: StepProps) {
  const [secondaryMode, setSecondaryMode] = useState<"bulk" | "single">("bulk");
  const [singleSecondary, setSingleSecondary] = useState("");
  const [bulkSecondaryText, setBulkSecondaryText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Add single secondary keyword
  const handleAddSingleSecondary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleSecondary.trim()) return;

    if (!data.secondary_keywords.includes(singleSecondary.trim())) {
      updateData({
        secondary_keywords: [...data.secondary_keywords, singleSecondary.trim()],
      });
    }

    setSingleSecondary("");
  };

  // Add bulk secondary keywords (1 line = 1 keyword)
  const handleAddBulkSecondary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkSecondaryText.trim()) return;

    const lines = bulkSecondaryText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const existingSet = new Set(data.secondary_keywords.map((k) => k.toLowerCase()));
    const newItems = lines.filter((l) => !existingSet.has(l.toLowerCase()));

    updateData({
      secondary_keywords: [...data.secondary_keywords, ...newItems],
    });

    setBulkSecondaryText("");
  };

  const handleRemoveSecondary = (kwToRemove: string) => {
    updateData({
      secondary_keywords: data.secondary_keywords.filter((k) => k !== kwToRemove),
    });
  };

  const handleClearAllSecondary = () => {
    updateData({ secondary_keywords: [] });
  };

  // Connect to live AI keyword suggestion endpoint
  const handleGenerateAIKeywords = async () => {
    setIsGenerating(true);
    setAiMessage(null);

    try {
      const res = await fetch("/api/ai/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: data.business_name,
          service_type: data.service_type || data.niche,
          city: data.city,
          state: data.state,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to generate keywords");
      }

      const existingSet = new Set(data.secondary_keywords.map((k) => k.toLowerCase()));
      const newSecondary = (json.secondary_keywords || []).filter(
        (k: string) => !existingSet.has(k.toLowerCase())
      );

      updateData({
        target_keyword: data.target_keyword || json.target_keyword,
        secondary_keywords: [...data.secondary_keywords, ...newSecondary],
      });

      setAiMessage(
        json.notice
          ? `${json.notice} (Added target & ${newSecondary.length} secondary keywords)`
          : `AI configured primary target keyword and added ${newSecondary.length} secondary keywords.`
      );
    } catch (err: unknown) {
      setAiMessage(err instanceof Error ? err.message : "Error contacting AI engine.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Generator Action Bar */}
      <Card className="border-border bg-muted/20">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Keyword Generation
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate 1 primary target keyword + supporting secondary keywords based on your trade and city.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateAIKeywords}
            disabled={isGenerating}
            className="border-primary/50 text-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {isGenerating ? "Generating..." : "Generate with AI"}
          </Button>
        </CardContent>
      </Card>

      {aiMessage && (
        <div className="rounded-md bg-primary/10 border border-primary/20 p-3 text-xs text-foreground flex items-center justify-between">
          <span>{aiMessage}</span>
          <button onClick={() => setAiMessage(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. Main Target Keyword (Exactly 1 Keyword) */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Key className="h-4 w-4 text-primary" />
            Target Keyword (Primary Keyword)
          </CardTitle>
          <CardDescription className="text-xs">
            The single most important search query for the entire website (e.g. &quot;water damage restoration arvada&quot;).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g. water damage restoration arvada"
            value={data.target_keyword}
            onChange={(e) => updateData({ target_keyword: e.target.value })}
            className="font-medium"
          />
        </CardContent>
      </Card>

      {/* 2. Secondary Keywords Section */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Secondary Keywords ({data.secondary_keywords.length})
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Supporting search terms, variations, and related long-tail phrases.
              </CardDescription>
            </div>

            {/* Input Mode Toggle (1 line = 1 keyword vs single) */}
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-md">
              <button
                type="button"
                onClick={() => setSecondaryMode("bulk")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  secondaryMode === "bulk"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListPlus className="h-3 w-3" />
                Paste List
              </button>
              <button
                type="button"
                onClick={() => setSecondaryMode("single")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  secondaryMode === "single"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3 w-3" />
                Single
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mode A: Multi-line Paste (1 line = 1 keyword) */}
          {secondaryMode === "bulk" && (
            <form onSubmit={handleAddBulkSecondary} className="space-y-3">
              <Textarea
                rows={5}
                placeholder={`flood damage restoration\nbasement water cleanup\nburst pipe repair\nemergency restoration service`}
                value={bulkSecondaryText}
                onChange={(e) => setBulkSecondaryText(e.target.value)}
                className="font-mono text-sm leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground">
                Paste keywords one per line. Each line is added as a secondary keyword.
              </p>
              <Button type="submit" size="sm" disabled={!bulkSecondaryText.trim()}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Keywords from List
              </Button>
            </form>
          )}

          {/* Mode B: Single Keyword Input */}
          {secondaryMode === "single" && (
            <form onSubmit={handleAddSingleSecondary} className="flex gap-2">
              <Input
                placeholder="e.g. flood damage restoration"
                value={singleSecondary}
                onChange={(e) => setSingleSecondary(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={!singleSecondary.trim()}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add
              </Button>
            </form>
          )}

          {/* Configured Secondary Keywords List */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Added Keywords:</span>
              {data.secondary_keywords.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSecondary}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {data.secondary_keywords.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No secondary keywords added yet. Paste a list above (1 line per keyword) or generate with AI.
              </div>
            ) : (
              <div className="divide-y divide-border rounded-md border border-border bg-card max-h-[260px] overflow-y-auto">
                {data.secondary_keywords.map((kw) => (
                  <div
                    key={kw}
                    className="flex items-center justify-between p-2.5 px-3 text-xs transition-colors hover:bg-muted/40"
                  >
                    <span className="font-medium text-foreground">{kw}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSecondary(kw)}
                      className="text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
