import { useState } from "react";
import { Plus, Trash2, Layers, Sparkles, X, FileText, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceFormData, WebsiteCreationFormData } from "@/types/create";

interface StepProps {
  data: WebsiteCreationFormData;
  updateData: (fields: Partial<WebsiteCreationFormData>) => void;
}

export function ServicesStep({ data, updateData }: StepProps) {
  const [inputMode, setInputMode] = useState<"single" | "bulk">("bulk");
  const [singleTitle, setSingleTitle] = useState("");
  const [singleKeywords, setSingleKeywords] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Single service add
  const handleAddSingleService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleTitle.trim()) return;

    const parsedKeywords = singleKeywords
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const newService: ServiceFormData = {
      id: crypto.randomUUID(),
      name: singleTitle.trim(),
      keywords: parsedKeywords.length > 0 ? parsedKeywords : undefined,
    };

    updateData({
      services: [...data.services, newService],
    });

    setSingleTitle("");
    setSingleKeywords("");
  };

  // Bulk multi-line paste/type (1 line = 1 service)
  const handleAddBulkServices = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const existingNames = new Set(data.services.map((s) => s.name.toLowerCase()));
    const newItems: ServiceFormData[] = lines
      .filter((line) => !existingNames.has(line.toLowerCase()))
      .map((line) => ({
        id: crypto.randomUUID(),
        name: line,
      }));

    updateData({
      services: [...data.services, ...newItems],
    });

    setBulkText("");
  };

  const handleRemoveService = (id: string) => {
    updateData({
      services: data.services.filter((s) => s.id !== id),
    });
  };

  const handleClearAll = () => {
    updateData({ services: [] });
  };

  // Connect to live AI service suggestion endpoint
  const handleGenerateAIServices = async () => {
    setIsGenerating(true);
    setAiMessage(null);

    try {
      const res = await fetch("/api/ai/suggest-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: data.business_name,
          service_type: data.service_type || data.niche,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to generate services");
      }

      const existingNames = new Set(data.services.map((s) => s.name.toLowerCase()));
      const newItems: ServiceFormData[] = (json.services || [])
        .filter((title: string) => !existingNames.has(title.toLowerCase()))
        .map((title: string) => ({
          id: crypto.randomUUID(),
          name: title,
        }));

      updateData({
        services: [...data.services, ...newItems],
      });

      setAiMessage(
        json.notice
          ? `${json.notice} (Added ${newItems.length} services)`
          : `AI generated ${newItems.length} service titles for your trade.`
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
              AI Service Suggestions
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically discover services relevant to your trade, keywords, and location.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateAIServices}
            disabled={isGenerating}
            className="border-primary/50 text-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {isGenerating ? "Generating..." : "Generate Services with AI"}
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

      {/* Input Mode Switcher (1 Line 1 Service vs Single Title) */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setInputMode("bulk")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            inputMode === "bulk"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ListPlus className="h-3.5 w-3.5" />
          Paste Services (1 line = 1 service)
        </button>
        <button
          type="button"
          onClick={() => setInputMode("single")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            inputMode === "single"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Service with Related Keywords
        </button>
      </div>

      {/* Mode 1: 1 Line = 1 Service (Multi-line Textarea) */}
      {inputMode === "bulk" && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <form onSubmit={handleAddBulkServices} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="bulk_services" className="font-semibold text-sm">
                  Paste or Type Services (One service per line)
                </Label>
                <Textarea
                  id="bulk_services"
                  rows={6}
                  placeholder={`Water Damage Restoration\nFlood Damage Restoration\nBasement Cleanup\nMold Remediation\nCommercial Water Damage`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="font-mono text-sm leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Paste a list of service titles directly. Each line will be added as a distinct service page.
                </p>
              </div>
              <Button type="submit" size="sm" disabled={!bulkText.trim()}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add All Services from List
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Mode 2: Service with Related Keywords & Entities (1 Line = 1 Keyword) */}
      {inputMode === "single" && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <form onSubmit={handleAddSingleService} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="service_name">Service Title *</Label>
                <Input
                  id="service_name"
                  placeholder="e.g. Water Damage Restoration"
                  value={singleTitle}
                  onChange={(e) => setSingleTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="service_keywords">
                  Related Keywords &amp; Entities (1 line = 1 keyword/entity)
                </Label>
                <Textarea
                  id="service_keywords"
                  rows={5}
                  placeholder={`flood cleanup\nemergency water extraction\nbasement flood drying\nIICRC certified restoration\nstructural dehumidification`}
                  value={singleKeywords}
                  onChange={(e) => setSingleKeywords(e.target.value)}
                  className="font-mono text-sm leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Paste supporting sub-keywords, semantic entities, or topics (one per line). These will be targeted on this service page.
                </p>
              </div>

              <Button type="submit" size="sm" disabled={!singleTitle.trim()}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Service with Keywords
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Configured Services List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Configured Services ({data.services.length})
          </h3>
          {data.services.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {data.services.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No services added yet. Paste a list above (1 line per service) or click &quot;Generate Services with AI&quot;.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border bg-card max-h-[360px] overflow-y-auto">
            {data.services.map((service, index) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-semibold text-muted-foreground w-6 pt-0.5">
                    #{index + 1}
                  </span>
                  <div>
                    <span className="font-medium text-foreground text-sm block">{service.name}</span>
                    {service.keywords && service.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {service.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveService(service.id)}
                  className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
