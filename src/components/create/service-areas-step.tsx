import { useState } from "react";
import { Sparkles, X, MapPin, ListPlus, Building2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { DetailedAreaFormData, WebsiteCreationFormData } from "@/types/create";

interface StepProps {
  data: WebsiteCreationFormData;
  updateData: (fields: Partial<WebsiteCreationFormData>) => void;
}

export function ServiceAreasStep({ data, updateData }: StepProps) {
  const [inputMode, setInputMode] = useState<"bulk" | "detailed">("bulk");
  const [areaName, setAreaName] = useState("");
  const [cityInfo, setCityInfo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Bulk line-by-line sync
  const handleBulkTextChange = (text: string) => {
    const areas = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    updateData({
      service_areas_text: text,
      service_areas: areas,
    });
  };

  // Add individual Area with City Information
  const handleAddDetailedArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) return;

    const newDetailed: DetailedAreaFormData = {
      id: crypto.randomUUID(),
      name: areaName.trim(),
      city_info: cityInfo.trim() || undefined,
    };

    const updatedDetailed = [...(data.detailed_areas || []), newDetailed];
    // Sync into main areas list if not already present
    const updatedAreas = Array.from(
      new Set([...data.service_areas, areaName.trim()])
    );

    updateData({
      detailed_areas: updatedDetailed,
      service_areas: updatedAreas,
      service_areas_text: updatedAreas.join("\n"),
    });

    setAreaName("");
    setCityInfo("");
  };

  const handleRemoveDetailedArea = (id: string) => {
    const remaining = (data.detailed_areas || []).filter((a) => a.id !== id);
    const updatedAreas = remaining.map((a) => a.name);
    updateData({
      detailed_areas: remaining,
      service_areas: updatedAreas,
      service_areas_text: updatedAreas.join("\n"),
    });
  };

  // Live AI Generator for City Information specifically
  const handleGenerateCityInfoWithAI = async () => {
    if (!areaName.trim()) {
      setAiMessage("Please enter an Area / City name first to generate information.");
      return;
    }

    setIsGeneratingInfo(true);
    setAiMessage(null);

    try {
      const res = await fetch("/api/ai/suggest-city-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area_name: areaName.trim(),
          state: data.state,
          service_type: data.service_type || data.niche,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to generate city info");
      }

      setCityInfo(json.city_info || "");
      setAiMessage(
        json.notice
          ? `${json.notice} (Generated info for ${areaName.trim()})`
          : `AI generated localized profile for ${areaName.trim()}. You can edit it freely.`
      );
    } catch (err: unknown) {
      setAiMessage(err instanceof Error ? err.message : "Error contacting AI engine.");
    } finally {
      setIsGeneratingInfo(false);
    }
  };

  // Live AI Generator for Service Areas List
  const handleGenerateAIAreas = async () => {
    setIsGenerating(true);
    setAiMessage(null);

    try {
      const res = await fetch("/api/ai/suggest-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: data.city,
          state: data.state,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to generate areas");
      }

      const suggestions: string[] = json.areas || [];
      const existing = data.service_areas_text
        ? data.service_areas_text.split("\n").map((s) => s.trim()).filter(Boolean)
        : [];

      const combined = Array.from(new Set([...existing, ...suggestions]));
      const newText = combined.join("\n");

      handleBulkTextChange(newText);
      setAiMessage(
        json.notice
          ? `${json.notice} (Added ${suggestions.length} service locations)`
          : `AI added ${suggestions.length} service locations around ${data.city || "your area"}.`
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
              AI Service Area Suggestions
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically discover cities, suburbs, and neighborhoods around {data.city || "your location"}. (Optional)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateAIAreas}
            disabled={isGenerating}
            className="border-primary/50 text-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {isGenerating ? "Generating..." : "Generate Service Areas with AI"}
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

      {/* Input Mode Switcher */}
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
          Paste Areas (1 line = 1 area)
        </button>
        <button
          type="button"
          onClick={() => setInputMode("detailed")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            inputMode === "detailed"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Service Area with City Information
        </button>
      </div>

      {/* Mode 1: Multi-line Textarea Area Input */}
      {inputMode === "bulk" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="service_areas" className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Service Areas List (One area per line - Optional)
            </Label>
            <span className="text-xs text-muted-foreground font-medium">
              {data.service_areas.length} {data.service_areas.length === 1 ? "area" : "areas"} detected
            </span>
          </div>

          <Textarea
            id="service_areas"
            rows={6}
            placeholder={"Arvada\nWestminster\nWheat Ridge\nLakewood\nGolden\nBroomfield"}
            value={data.service_areas_text}
            onChange={(e) => handleBulkTextChange(e.target.value)}
            className="font-mono text-sm leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">
            Type or paste city and neighborhood names directly. (Not compulsory — leave empty if not needed).
          </p>
        </div>
      )}

      {/* Mode 2: Area with City Information & AI Button */}
      {inputMode === "detailed" && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <form onSubmit={handleAddDetailedArea} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="area_name">Area / City Name</Label>
                <Input
                  id="area_name"
                  placeholder="e.g. Westminster or North Arvada"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="city_info">
                    City Information (Optional — 1 line or paragraph)
                  </Label>
                  <button
                    type="button"
                    onClick={handleGenerateCityInfoWithAI}
                    disabled={isGeneratingInfo || !areaName.trim()}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    {isGeneratingInfo ? "Generating Info..." : "Generate City Info with AI"}
                  </button>
                </div>
                <Textarea
                  id="city_info"
                  rows={4}
                  placeholder="Local landmarks, weather quirks (e.g. hail risk), neighborhood details, historical context..."
                  value={cityInfo}
                  onChange={(e) => setCityInfo(e.target.value)}
                  className="text-sm leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Completely optional! If provided, AI will weave this local knowledge into this area&apos;s landing page.
                </p>
              </div>

              <Button type="submit" size="sm" disabled={!areaName.trim()}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Area with City Info
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List of Detailed Areas added */}
      {data.detailed_areas && data.detailed_areas.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-muted-foreground">
            Custom Configured City Areas ({data.detailed_areas.length}):
          </span>
          <div className="divide-y divide-border rounded-md border border-border bg-card max-h-[220px] overflow-y-auto">
            {data.detailed_areas.map((item) => (
              <div key={item.id} className="p-3 text-xs flex items-start justify-between">
                <div>
                  <span className="font-semibold text-foreground text-sm block">{item.name}</span>
                  {item.city_info && (
                    <p className="text-muted-foreground mt-0.5 text-[11px] line-clamp-2">
                      {item.city_info}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDetailedArea(item.id)}
                  className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ZIP Code Setting Checkbox */}
      <div className="rounded-lg border border-border p-4 bg-card">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.include_zip_codes}
            onChange={(e) => updateData({ include_zip_codes: e.target.checked })}
            className="h-4 w-4 mt-0.5 rounded border-border text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-foreground">
              Include ZIP codes in service-area content
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              When checked, AI will research and naturally include verified postal codes for each target neighborhood.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
