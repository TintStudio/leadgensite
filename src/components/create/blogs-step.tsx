import { useState } from "react";
import { Plus, Trash2, BookOpen, Sparkles, X, ListPlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { WebsiteCreationFormData } from "@/types/create";

interface StepProps {
  data: WebsiteCreationFormData;
  updateData: (fields: Partial<WebsiteCreationFormData>) => void;
}

export function BlogsStep({ data, updateData }: StepProps) {
  const [inputMode, setInputMode] = useState<"bulk" | "single">("bulk");
  const [singleBlogTitle, setSingleBlogTitle] = useState("");
  const [bulkBlogText, setBulkBlogText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Add single blog
  const handleAddSingleBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleBlogTitle.trim()) return;

    if (!data.blog_titles.includes(singleBlogTitle.trim())) {
      updateData({
        blog_titles: [...data.blog_titles, singleBlogTitle.trim()],
      });
    }

    setSingleBlogTitle("");
  };

  // Add bulk blogs (1 line = 1 blog)
  const handleAddBulkBlogs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkBlogText.trim()) return;

    const lines = bulkBlogText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const existingSet = new Set(data.blog_titles.map((t) => t.toLowerCase()));
    const newItems = lines.filter((l) => !existingSet.has(l.toLowerCase()));

    updateData({
      blog_titles: [...data.blog_titles, ...newItems],
    });

    setBulkBlogText("");
  };

  const handleRemoveBlog = (titleToRemove: string) => {
    updateData({
      blog_titles: data.blog_titles.filter((t) => t !== titleToRemove),
    });
  };

  const handleClearAll = () => {
    updateData({ blog_titles: [] });
  };

  // Connect to live AI blog suggestion endpoint
  const handleGenerateAIBlogs = async () => {
    setIsGenerating(true);
    setAiMessage(null);

    try {
      const res = await fetch("/api/ai/suggest-blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: data.service_type || data.niche,
          city: data.city,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to generate blogs");
      }

      const existingSet = new Set(data.blog_titles.map((t) => t.toLowerCase()));
      const newItems = (json.blog_titles || []).filter(
        (t: string) => !existingSet.has(t.toLowerCase())
      );

      updateData({
        blog_titles: [...data.blog_titles, ...newItems],
      });

      setAiMessage(
        json.notice
          ? `${json.notice} (Added ${newItems.length} topics)`
          : `AI generated ${newItems.length} high-authority blog ideas for local SEO.`
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
              AI Blog Ideas Generator
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate informational local SEO blog topics matching your services and service areas.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateAIBlogs}
            disabled={isGenerating}
            className="border-primary/50 text-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {isGenerating ? "Generating..." : "Generate Blog Ideas with AI"}
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

      {/* Input Mode Switcher (1 Line = 1 Blog vs Single Input) */}
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
          Paste Blogs (1 line = 1 blog)
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
          Add Single Blog
        </button>
      </div>

      {/* Mode 1: 1 Line = 1 Blog (Multi-line Textarea) */}
      {inputMode === "bulk" && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <form onSubmit={handleAddBulkBlogs} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="bulk_blogs" className="font-semibold text-sm">
                  Paste or Type Blog Titles (One title per line)
                </Label>
                <Textarea
                  id="bulk_blogs"
                  rows={6}
                  placeholder={`What to Do After Water Damage in Your Home\nHow to Prevent Basement Water Damage\nSigns You Need Professional Restoration Services\nEmergency Steps for Burst Pipes`}
                  value={bulkBlogText}
                  onChange={(e) => setBulkBlogText(e.target.value)}
                  className="font-mono text-sm leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Paste blog topics directly. Each line will be added as a separate planned article.
                </p>
              </div>
              <Button type="submit" size="sm" disabled={!bulkBlogText.trim()}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add All Blogs from List
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Mode 2: Single Blog Title Input */}
      {inputMode === "single" && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <form onSubmit={handleAddSingleBlog} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="single_blog">Blog Post Title / Idea</Label>
                <Input
                  id="single_blog"
                  placeholder="e.g. What to Do After Water Damage in Your Home"
                  value={singleBlogTitle}
                  onChange={(e) => setSingleBlogTitle(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Enter article ideas to build local topic authority.
                </p>
              </div>
              <div className="self-end pb-5">
                <Button type="submit" size="default" disabled={!singleBlogTitle.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Blog
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Configured Blog Titles List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Planned Blog Posts ({data.blog_titles.length})
          </h3>
          {data.blog_titles.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {data.blog_titles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No blog topics added yet. Paste a list above (1 line per blog) or click &quot;Generate Blog Ideas with AI&quot;. (Optional)
          </div>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border bg-card max-h-[360px] overflow-y-auto">
            {data.blog_titles.map((title) => (
              <div
                key={title}
                className="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/40"
              >
                <span className="font-medium text-foreground text-sm">{title}</span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveBlog(title)}
                  className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
