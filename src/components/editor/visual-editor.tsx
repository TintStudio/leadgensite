"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  PageContentForm,
  EditablePageData,
} from "./page-content-form";
import { DevicePreviewFrame } from "./device-preview-frame";

interface VisualEditorProps {
  websiteId: string;
  businessName: string;
  domain: string;
  initialPages: EditablePageData[];
}

export function VisualEditor({
  websiteId,
  businessName,
  domain,
  initialPages,
}: VisualEditorProps) {
  const [pages, setPages] = useState<EditablePageData[]>(initialPages);
  const [selectedPageId, setSelectedPageId] = useState<string>(
    initialPages[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);

  const currentPage =
    pages.find((p) => p.id === selectedPageId) || pages[0];

  const handlePageChange = (updated: EditablePageData) => {
    setPages((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleSaveAndRecompile = async () => {
    if (!currentPage) return;

    try {
      setIsSaving(true);
      setSaveMessage(null);
      setSaveError(null);

      const res = await fetch(
        `/api/websites/${websiteId}/pages/${currentPage.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: currentPage.title,
            meta_title: currentPage.meta_title,
            meta_description: currentPage.meta_description,
            content_data: currentPage.content_data,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save page");
      }

      setSaveMessage("Saved & Re-compiled Successfully!");
      // Increment reload key so the iframe reloads with the fresh compiled HTML
      setPreviewReloadKey((k) => k + 1);

      setTimeout(() => {
        setSaveMessage(null);
      }, 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.page_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Top Editor Header */}
      <header className="h-14 border-b border-border px-4 flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/websites/${websiteId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Overview</span>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div>
            <h1 className="text-sm font-bold text-foreground leading-none">
              {businessName}
            </h1>
            <span className="text-[11px] text-muted-foreground font-mono">
              {domain}
            </span>
          </div>
        </div>

        {/* Save & Feedback Action */}
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              {saveMessage}
            </span>
          )}
          {saveError && (
            <span className="text-xs font-semibold text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {saveError}
            </span>
          )}

          <Button
            onClick={handleSaveAndRecompile}
            disabled={isSaving}
            size="sm"
            className="gap-1.5 font-semibold text-xs h-8"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Re-compiling..." : "Save & Re-compile"}
          </Button>
        </div>
      </header>

      {/* Main 3-Column Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Pages Directory (240px) */}
        <div className="w-60 border-r border-border flex flex-col bg-muted/10 shrink-0">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages..."
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredPages.map((p) => {
              const isSelected = p.id === selectedPageId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPageId(p.id)}
                  className={`w-full text-left p-2 rounded-md transition-colors flex flex-col gap-0.5 ${
                    isSelected
                      ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                      : "hover:bg-muted/60 text-foreground border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs truncate font-medium">{p.title}</span>
                    <Badge variant="outline" className="text-[9px] uppercase font-mono px-1 py-0 h-4 shrink-0">
                      {p.page_type}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    /{p.slug || "index"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Column: Form Editor (45%) */}
        <div className="w-[45%] flex flex-col border-r border-border overflow-hidden">
          {currentPage ? (
            <PageContentForm
              key={currentPage.id}
              page={currentPage}
              onChange={handlePageChange}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
              No page selected
            </div>
          )}
        </div>

        {/* Right Column: Live Responsive Preview (55%) */}
        <div className="flex-1 overflow-hidden">
          <DevicePreviewFrame
            websiteId={websiteId}
            domain={domain}
            currentSlug={currentPage?.slug || ""}
            reloadKey={previewReloadKey}
          />
        </div>
      </div>
    </div>
  );
}
