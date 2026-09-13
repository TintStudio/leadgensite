"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WebsiteCreationFormData } from "@/types/create";
import { DEFAULT_TEMPLATES, TemplateRecord } from "@/lib/config/templates";

export { DEFAULT_TEMPLATES as TEMPLATES } from "@/lib/config/templates";

interface StepProps {
  data: WebsiteCreationFormData;
  updateData: (fields: Partial<WebsiteCreationFormData>) => void;
}

export function DesignStep({ data, updateData }: StepProps) {
  const [templates, setTemplates] = useState<TemplateRecord[]>(
    DEFAULT_TEMPLATES.filter((t) => t.isActive)
  );

  const currentTemplateId = data.template_id;

  useEffect(() => {
    let isMounted = true;
    async function loadActiveTemplates() {
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && Array.isArray(json.templates) && json.templates.length > 0) {
            setTemplates(json.templates);
            // If current template is not in active templates, pick first active
            if (!json.templates.some((t: TemplateRecord) => t.id === currentTemplateId)) {
              updateData({ template_id: json.templates[0].id });
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch dynamic templates:", err);
      }
    }
    loadActiveTemplates();
    return () => {
      isMounted = false;
    };
  }, [currentTemplateId, updateData]);

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          Choose Website Template
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select a high-conversion niche template tailored to your trade.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((tmpl) => {
          const isSelected = data.template_id === tmpl.id;
          return (
            <Card
              key={tmpl.id}
              className={cn(
                "cursor-pointer transition-all border",
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-muted/20"
                  : "border-border hover:border-foreground/40"
              )}
              onClick={() => updateData({ template_id: tmpl.id })}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 border border-border"
                        style={{ backgroundColor: tmpl.colorHex || "#2563eb" }}
                      />
                      {tmpl.name}
                    </span>
                    <span className="text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    {isSelected ? "Selected" : "Click to select"}
                  </span>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
