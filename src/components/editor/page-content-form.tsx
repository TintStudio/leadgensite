"use client";

import { useState } from "react";
import {
  Search,
  HelpCircle,
  Plus,
  Trash2,
  Code,
  LayoutTemplate,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface EditablePageData {
  id: string;
  website_id: string;
  page_type: "homepage" | "service" | "service-area" | "blog" | "contact" | string;
  title: string;
  slug: string;
  meta_title?: string;
  meta_description?: string;
  content_data: Record<string, unknown>;
}

interface PageContentFormProps {
  page: EditablePageData;
  onChange: (updated: EditablePageData) => void;
}

type TabKey = "content" | "sections" | "faqs" | "seo" | "json";

export function PageContentForm({ page, onChange }: PageContentFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("content");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = (page.content_data || {}) as Record<string, any>;

  // Update a nested path in content_data
  const updateContentField = (path: string, value: unknown) => {
    const newContent = { ...content };
    const keys = path.split(".");
    let current: Record<string, unknown> = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;

    onChange({
      ...page,
      content_data: newContent,
    });
  };

  const updatePageField = (field: "title" | "meta_title" | "meta_description", value: string) => {
    onChange({
      ...page,
      [field]: value,
    });
  };

  // FAQ management
  const faqs: Array<{ question: string; answer: string }> = Array.isArray(content.faqs)
    ? content.faqs
    : [];

  const handleFaqChange = (index: number, field: "question" | "answer", val: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: val };
    updateContentField("faqs", updated);
  };

  const addFaq = () => {
    const updated = [...faqs, { question: "New Question?", answer: "Answer here." }];
    updateContentField("faqs", updated);
  };

  const removeFaq = (index: number) => {
    const updated = faqs.filter((_, i) => i !== index);
    updateContentField("faqs", updated);
  };

  // Raw JSON edit handler
  const handleJsonChange = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      setJsonError(null);
      onChange({
        ...page,
        content_data: parsed,
      });
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON syntax");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Form Tabs */}
      <div className="flex items-center gap-1 border-b border-border px-6 py-2 bg-muted/20 overflow-x-auto">
        <button
          onClick={() => setActiveTab("content")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "content"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          Hero & Body
        </button>

        <button
          onClick={() => setActiveTab("sections")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "sections"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Sections
        </button>

        <button
          onClick={() => setActiveTab("faqs")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "faqs"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          FAQs ({faqs.length})
        </button>

        <button
          onClick={() => setActiveTab("seo")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "seo"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          SEO Meta
        </button>

        <button
          onClick={() => setActiveTab("json")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "json"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Code className="h-3.5 w-3.5" />
          Raw JSON
        </button>
      </div>

      {/* Form Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: HERO & BODY */}
        {activeTab === "content" && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Page Title</Label>
              <Input
                value={page.title || ""}
                onChange={(e) => updatePageField("title", e.target.value)}
                placeholder="Page Title"
              />
            </div>

            {/* Hero Section */}
            <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Hero Section
              </span>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hero Headline</Label>
                <Input
                  value={content.hero?.headline || content.headline || ""}
                  onChange={(e) => updateContentField("hero.headline", e.target.value)}
                  placeholder="Primary Call to Action Headline"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hero Subheadline</Label>
                <Textarea
                  rows={2}
                  value={content.hero?.subheadline || content.subheadline || ""}
                  onChange={(e) => updateContentField("hero.subheadline", e.target.value)}
                  placeholder="Supporting value proposition snippet"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hero CTA Button Text</Label>
                <Input
                  value={content.hero?.cta_text || "Request Immediate Dispatch"}
                  onChange={(e) => updateContentField("hero.cta_text", e.target.value)}
                />
              </div>
            </div>

            {/* Main Body / Intro */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {page.page_type === "homepage"
                  ? "About Business Story"
                  : page.page_type === "service"
                  ? "Service Overview & Scope"
                  : page.page_type === "service-area"
                  ? "Neighborhood & Local Area Overview"
                  : page.page_type === "blog"
                  ? "Article Excerpt / Intro"
                  : "Overview"}
              </Label>
              <Textarea
                rows={5}
                value={
                  content.about?.story ||
                  content.main_content ||
                  content.local_intro ||
                  content.excerpt ||
                  content.description ||
                  ""
                }
                onChange={(e) => {
                  if (page.page_type === "homepage") {
                    updateContentField("about.story", e.target.value);
                  } else if (page.page_type === "service") {
                    updateContentField("main_content", e.target.value);
                  } else if (page.page_type === "service-area") {
                    updateContentField("local_intro", e.target.value);
                  } else if (page.page_type === "blog") {
                    updateContentField("excerpt", e.target.value);
                  } else {
                    updateContentField("description", e.target.value);
                  }
                }}
                placeholder="Enter detailed content..."
              />
            </div>
          </div>
        )}

        {/* TAB 2: SECTIONS */}
        {activeTab === "sections" && (
          <div className="space-y-5">
            {page.page_type === "homepage" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Why Choose Us - Section Heading</Label>
                  <Input
                    value={content.why_choose_us?.heading || "Why Local Homeowners Choose Us"}
                    onChange={(e) => updateContentField("why_choose_us.heading", e.target.value)}
                  />
                </div>

                {Array.isArray((content.why_choose_us as Record<string, unknown>)?.points) &&
                  ((content.why_choose_us as Record<string, unknown>).points as Array<Record<string, string>>).map((p, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-md bg-muted/10 space-y-2">
                      <Label className="text-xs font-semibold">Point {i + 1} Title</Label>
                      <Input
                        value={p.title || ""}
                        onChange={(e) => {
                          const points = [...((content.why_choose_us as Record<string, unknown>).points as Array<Record<string, string>>)];
                          points[i] = { ...points[i], title: e.target.value };
                          updateContentField("why_choose_us.points", points);
                        }}
                      />
                      <Label className="text-xs font-semibold">Description</Label>
                      <Textarea
                        rows={2}
                        value={p.description || ""}
                        onChange={(e) => {
                          const points = [...((content.why_choose_us as Record<string, unknown>).points as Array<Record<string, string>>)];
                          points[i] = { ...points[i], description: e.target.value };
                          updateContentField("why_choose_us.points", points);
                        }}
                      />
                    </div>
                  ))}
              </div>
            )}

            {page.page_type === "service" && (
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Step-by-Step Restoration / Repair Process
                </span>
                {Array.isArray(content.process_steps) &&
                  (content.process_steps as Array<Record<string, string>>).map((step, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-md bg-muted/10 space-y-2">
                      <Label className="text-xs font-semibold">Step {i + 1}: {step.title}</Label>
                      <Input
                        value={step.title || ""}
                        onChange={(e) => {
                          const steps = [...(content.process_steps as Array<Record<string, string>>)];
                          steps[i] = { ...steps[i], title: e.target.value };
                          updateContentField("process_steps", steps);
                        }}
                        placeholder="Step title"
                      />
                      <Textarea
                        rows={2}
                        value={step.description || ""}
                        onChange={(e) => {
                          const steps = [...(content.process_steps as Array<Record<string, string>>)];
                          steps[i] = { ...steps[i], description: e.target.value };
                          updateContentField("process_steps", steps);
                        }}
                        placeholder="Step description"
                      />
                    </div>
                  ))}
              </div>
            )}

            {page.page_type === "service-area" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Response Guarantee Notice</Label>
                  <Input
                    value={content.response_guarantee || "Guaranteed 45-minute on-site arrival"}
                    onChange={(e) => updateContentField("response_guarantee", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Local Geographic Context</Label>
                  <Textarea
                    rows={4}
                    value={content.local_context || ""}
                    onChange={(e) => updateContentField("local_context", e.target.value)}
                    placeholder="Local weather challenges, plumbing codes, or neighborhood specifics..."
                  />
                </div>
              </div>
            )}

            {page.page_type === "blog" && (
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Article Body Sections
                </span>
                {Array.isArray(content.sections) &&
                  (content.sections as Array<Record<string, string>>).map((sec, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-md bg-muted/10 space-y-2">
                      <Label className="text-xs font-semibold">Section {i + 1} Heading</Label>
                      <Input
                        value={sec.heading || ""}
                        onChange={(e) => {
                          const sections = [...(content.sections as Array<Record<string, string>>)];
                          sections[i] = { ...sections[i], heading: e.target.value };
                          updateContentField("sections", sections);
                        }}
                      />
                      <Label className="text-xs font-semibold">Body Content</Label>
                      <Textarea
                        rows={4}
                        value={sec.content || ""}
                        onChange={(e) => {
                          const sections = [...(content.sections as Array<Record<string, string>>)];
                          sections[i] = { ...sections[i], content: e.target.value };
                          updateContentField("sections", sections);
                        }}
                      />
                    </div>
                  ))}
              </div>
            )}

            {page.page_type === "contact" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Office Hours</Label>
                  <Input
                    value={content.office_hours || "Monday - Saturday: 7:00 AM - 8:00 PM (24/7 Emergency Line)"}
                    onChange={(e) => updateContentField("office_hours", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Emergency Dispatch Notice</Label>
                  <Textarea
                    rows={3}
                    value={content.emergency_notice || "Call now for immediate priority service dispatch."}
                    onChange={(e) => updateContentField("emergency_notice", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FAQS */}
        {activeTab === "faqs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">Frequently Asked Questions</h4>
                <p className="text-[11px] text-muted-foreground">
                  FAQ Schema markup will automatically mirror these questions for Google rich snippets.
                </p>
              </div>
              <Button onClick={addFaq} variant="outline" size="sm" className="h-7 text-xs gap-1 border-border">
                <Plus className="h-3 w-3" />
                Add FAQ
              </Button>
            </div>

            {faqs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <HelpCircle className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">No FAQs yet. Click above to add one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="p-3 rounded-md border border-border bg-muted/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Question {i + 1}</Label>
                      <button
                        onClick={() => removeFaq(i)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        title="Remove question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      value={faq.question}
                      onChange={(e) => handleFaqChange(i, "question", e.target.value)}
                      placeholder="e.g. How quickly can your team arrive?"
                    />
                    <Label className="text-xs font-semibold">Answer</Label>
                    <Textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(i, "answer", e.target.value)}
                      placeholder="Answer details..."
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SEO METADATA */}
        {activeTab === "seo" && (
          <div className="space-y-5">
            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
              <span className="text-xs font-bold text-foreground block">
                Google Search Result Preview
              </span>
              <div className="p-3 bg-background rounded border border-border space-y-1">
                <div className="text-xs text-[#202124] font-medium truncate">
                  https://yourdomain.com/{page.slug || ""}
                </div>
                <div className="text-sm font-semibold text-[#1a0dab] truncate">
                  {page.meta_title || page.title}
                </div>
                <div className="text-xs text-[#4d5156] line-clamp-2">
                  {page.meta_description || "No description specified yet."}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Meta Title Tag</Label>
                <span className={`text-[10px] ${page.meta_title && page.meta_title.length > 60 ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>
                  {page.meta_title?.length || 0} / 60 characters
                </span>
              </div>
              <Input
                value={page.meta_title || ""}
                onChange={(e) => updatePageField("meta_title", e.target.value)}
                placeholder="Keyword Rich Title Tag | Business Name"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Meta Description</Label>
                <span className={`text-[10px] ${page.meta_description && page.meta_description.length > 160 ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>
                  {page.meta_description?.length || 0} / 160 characters
                </span>
              </div>
              <Textarea
                rows={3}
                value={page.meta_description || ""}
                onChange={(e) => updatePageField("meta_description", e.target.value)}
                placeholder="High-converting description for search snippets..."
              />
            </div>
          </div>
        )}

        {/* TAB 5: RAW JSON */}
        {activeTab === "json" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Structured Content JSON</Label>
              {jsonError ? (
                <Badge variant="destructive" className="text-[10px]">
                  Syntax Error
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  Valid JSON
                </Badge>
              )}
            </div>
            {jsonError && (
              <p className="text-xs text-destructive font-mono">{jsonError}</p>
            )}
            <Textarea
              rows={18}
              defaultValue={JSON.stringify(page.content_data || {}, null, 2)}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="font-mono text-xs leading-relaxed"
            />
          </div>
        )}
      </div>
    </div>
  );
}
