"use client";

import { useState } from "react";
import {
  Save,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { PromptTemplateItem } from "@/app/api/admin/prompts/route";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface PromptsManagerProps {
  initialPrompts: PromptTemplateItem[];
}

export function PromptsManager({ initialPrompts }: PromptsManagerProps) {
  const [prompts, setPrompts] = useState<PromptTemplateItem[]>(initialPrompts);
  const [selectedId, setSelectedId] = useState<string>(initialPrompts[0]?.id || "system");
  const [currentText, setCurrentText] = useState<string>(initialPrompts[0]?.template || "");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedPrompt =
    prompts.find((p) => p.id === selectedId) || prompts[0];

  const handleSelectPrompt = (id: string) => {
    setSelectedId(id);
    const target = prompts.find((p) => p.id === id);
    if (target) {
      setCurrentText(target.template);
    }
  };

  const handleInsertVariable = (varName: string) => {
    setCurrentText((prev) => `${prev} {{${varName}}}`);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/admin/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: selectedId,
          template: currentText,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save prompt template");
      }

      setPrompts((prev) =>
        prev.map((p) => (p.id === selectedId ? { ...p, template: currentText } : p))
      );

      setToastMessage("Prompt template saved successfully!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-lg bg-background overflow-hidden flex flex-col md:flex-row h-[700px]">
      {/* Prompts Navigation (Sidebar) */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-muted/10 p-3 space-y-1 shrink-0 overflow-y-auto">
        {/* Group 1: Global AI Rules */}
        <div className="pt-1 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1 block">
            1. Core Rules
          </span>
          {prompts
            .filter((p) => p.category === "system")
            .map((p) => {
              const isSelected = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPrompt(p.id)}
                  className={`w-full text-left p-2 rounded-md text-xs transition-colors flex flex-col gap-0.5 border mb-1 ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                </button>
              );
            })}
        </div>

        {/* Group 2: Homepage Modular Sections */}
        <div className="pt-2 pb-1 border-t border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-1 block font-semibold">
            2. Homepage Sections
          </span>
          {prompts
            .filter((p) => p.category === "section")
            .map((p) => {
              const isSelected = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPrompt(p.id)}
                  className={`w-full text-left p-2 rounded-md text-xs transition-colors flex flex-col gap-0.5 border mb-1 ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate font-medium">{p.name.replace("Homepage: ", "")}</span>
                  </div>
                  <span
                    className={`text-[10px] truncate ${
                      isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    Section Generator
                  </span>
                </button>
              );
            })}
        </div>

        {/* Group 3: Full Page Prompts */}
        <div className="pt-2 pb-1 border-t border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1 block">
            3. Full Page Generators
          </span>
          {prompts
            .filter((p) => p.category === "page")
            .map((p) => {
              const isSelected = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPrompt(p.id)}
                  className={`w-full text-left p-2 rounded-md text-xs transition-colors flex flex-col gap-0.5 border mb-1 ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Main Prompt Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor Top Bar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">
                {selectedPrompt.name}
              </h2>
              <Badge variant="outline" className="text-[10px] uppercase font-mono border-border">
                {selectedPrompt.category}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedPrompt.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {toastMessage && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {toastMessage}
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5 text-xs font-semibold h-8"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "Saving..." : "Save Prompt"}
            </Button>
          </div>
        </div>

        {/* Available Interpolation Variables */}
        {selectedPrompt.variables.length > 0 && (
          <div className="px-4 py-2.5 border-b border-border bg-muted/10 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Click to insert variable:
            </span>
            {selectedPrompt.variables.map((v) => (
              <button
                key={v}
                onClick={() => handleInsertVariable(v)}
                className="px-2 py-0.5 rounded bg-background border border-border text-[11px] font-mono text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                title={`Insert {{${v}}}`}
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        )}

        {/* Textarea Editor */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <Textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            className="flex-1 font-mono text-xs leading-relaxed resize-none p-3.5 bg-background border-border"
            placeholder="Enter prompt instructions..."
          />
        </div>
      </div>
    </div>
  );
}
