"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Save,
  RefreshCw,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AnalysisResult, SuggestedMapping } from "@/lib/templates/analyzer";

const PLANS = [
  { id: "free", label: "Free Plan" },
  { id: "starter", label: "Starter ($29/mo)" },
  { id: "pro", label: "Professional ($79/mo)" },
  { id: "agency", label: "Agency ($199/mo)" },
];

export function TemplateMaker() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow steps: 1: Upload -> 2: Review Mappings -> 3: Preview -> 4: Save
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Upload & Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Editable mappings
  const [mappings, setMappings] = useState<SuggestedMapping[]>([]);

  // Registration Metadata
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Home Services");
  const [niche] = useState("");
  const [description, setDescription] = useState("");
  const [colorHex, setColorHex] = useState("#1e3a8a");
  const [version, setVersion] = useState("v1");
  const [availablePlans, setAvailablePlans] = useState<string[]>(["free", "starter", "pro", "agency"]);
  const [isVisible, setIsVisible] = useState(false); // Default to Hidden until tested!

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle File Selection & Auto-analysis
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFile = e.target.files[0];
    await analyzeFile(selectedFile);
  };

  const analyzeFile = async (targetFile: File) => {
    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", targetFile);

    try {
      const res = await fetch("/api/admin/templates/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to analyze template");
      }

      setAnalysis(data.analysis);
      setMappings(data.analysis.suggestedMappings);

      // Prepopulate name and slug if available
      if (data.analysis.title && !name) {
        const cleanTitle = data.analysis.title.replace(/\|.*$/, "").trim();
        setName(cleanTitle || targetFile.name.replace(/\.[^/.]+$/, ""));
        setSlug(
          (cleanTitle || targetFile.name)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
        );
      }

      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error analyzing uploaded template";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle Plan Selection
  const togglePlan = (planId: string) => {
    setAvailablePlans((prev) =>
      prev.includes(planId) ? prev.filter((p) => p !== planId) : [...prev, planId]
    );
  };

  // Toggle / Edit mapping
  const toggleMappingAccept = (id: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, accepted: !m.accepted } : m))
    );
  };

  const updateMappingVariable = (id: string, variable: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, suggestedVariable: variable } : m))
    );
  };

  // Final Save Handler
  const handleSaveTemplate = async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Please provide a Template Name and Slug ID.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/templates/save-maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          category,
          niche: niche || name,
          description,
          colorHex,
          colorName: "Solid Palette",
          isActive: isVisible,
          version,
          availablePlans,
          rawHtml: analysis?.rawHtml || "",
          rawCss: analysis?.css || "",
          approvedMappings: mappings,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to register template");
      }

      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/admin/templates");
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save template bundle";
      setError(msg);
      setIsSaving(false);
    }
  };

  // Prepare Mock Preview HTML
  const generatePreviewHtml = () => {
    if (!analysis) return "";
    let html = analysis.rawHtml;

    // Apply mappings with mock data
    const mockData: Record<string, string> = {
      "{{project.business_name}}": "Summit Ridge Plumbing",
      "{{project.phone}}": "(555) 789-2026",
      "{{phoneLink project.phone}}": "tel:+15557892026",
      "{{project.city}}, {{project.state}}": "Boulder, CO",
      "{{content.hero.headline}}": "24/7 Master Plumbers in Boulder",
      "{{currentYear}}": "2026",
    };

    for (const m of mappings) {
      if (m.accepted && m.detectedText) {
        const replacement = mockData[m.suggestedVariable] || m.suggestedVariable;
        html = html.replaceAll(m.detectedText, replacement);
      }
    }

    return html;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Workflow Progress Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/templates"
            className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Template Maker
            </h1>
            <p className="text-xs text-muted-foreground">
              Ingest existing HTML or ZIP static sites and convert them into dynamic Handlebars templates.
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span
            className={cn(
              "px-2.5 py-1 rounded border",
              step === 1 ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground"
            )}
          >
            1. Upload
          </span>
          <span className="text-muted-foreground">&rarr;</span>
          <span
            className={cn(
              "px-2.5 py-1 rounded border",
              step === 2 ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground"
            )}
          >
            2. Review Mappings
          </span>
          <span className="text-muted-foreground">&rarr;</span>
          <span
            className={cn(
              "px-2.5 py-1 rounded border",
              step === 3 ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground"
            )}
          >
            3. Preview
          </span>
          <span className="text-muted-foreground">&rarr;</span>
          <span
            className={cn(
              "px-2.5 py-1 rounded border",
              step === 4 ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground"
            )}
          >
            4. Register
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 1: UPLOAD & INGESTION                           */}
      {/* ==================================================== */}
      {step === 1 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">
              Step 1: Upload Existing Website or Template
            </CardTitle>
            <CardDescription className="text-xs">
              Upload a single <code className="font-mono">.html</code> file or a <code className="font-mono">.zip</code> containing your HTML, CSS, and images.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/10 flex flex-col items-center justify-center space-y-3"
            >
              <div className="p-3 bg-primary/10 text-primary rounded-full">
                <Upload className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Click to browse or drag and drop your template file
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports ZIP archives (with index.html & style.css) or raw HTML files (Max 15MB).
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.html,.htm"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {isAnalyzing && (
              <div className="p-4 rounded-lg bg-muted border border-border flex items-center justify-center gap-3 text-xs text-foreground">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                <span>Extracting files, scanning DOM sections, and generating dynamic field mappings...</span>
              </div>
            )}

            {/* Security Guard Notice */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
              <div>
                <span className="font-bold block">Strict Sandbox & Security Isolation</span>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Uploaded files are sanitized against path traversal (Zip Slip), executable scripts (.php, .py, .sh) are rejected, and template previews are executed inside a sandboxed frame.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================== */}
      {/* STEP 2: REVIEW DETECTED SECTIONS & MAPPINGS          */}
      {/* ==================================================== */}
      {step === 2 && analysis && (
        <div className="space-y-6">
          {/* Detected Sections Overview */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                <span>Semantic Section Detection</span>
                <Badge variant="secondary" className="text-xs font-mono">
                  {analysis.detectedSections.filter((s) => s.detected).length} / {analysis.detectedSections.length} Sections Found
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {analysis.detectedSections.map((sec) => (
                  <div
                    key={sec.id}
                    className={cn(
                      "p-2.5 rounded border text-xs flex items-center justify-between",
                      sec.detected
                        ? "border-emerald-200 bg-emerald-50/50 text-emerald-950"
                        : "border-border bg-muted/20 text-muted-foreground opacity-60"
                    )}
                  >
                    <div>
                      <span className="font-semibold block">{sec.name}</span>
                      <span className="text-[10px] block opacity-80">{sec.elementTag}</span>
                    </div>
                    {sec.detected ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-[10px] italic">Optional</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggested Dynamic Mappings */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground">
                Human-in-the-Loop AI Placeholder Mappings
              </CardTitle>
              <CardDescription className="text-xs">
                Review hard-coded text detected in the static HTML and confirm or adjust the suggested Handlebars variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-3 w-12 text-center">Use</th>
                      <th className="p-3">Section</th>
                      <th className="p-3">Detected Static Content</th>
                      <th className="p-3">Suggested Handlebars Variable</th>
                      <th className="p-3 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mappings.map((m) => (
                      <tr key={m.id} className={cn(!m.accepted && "opacity-40 bg-muted/10")}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={m.accepted}
                            onChange={() => toggleMappingAccept(m.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="p-3 font-medium text-foreground">{m.section}</td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                          &ldquo;{m.detectedText}&rdquo;
                        </td>
                        <td className="p-3">
                          <Input
                            value={m.suggestedVariable}
                            onChange={(e) => updateMappingVariable(m.id, e.target.value)}
                            disabled={!m.accepted}
                            className="font-mono text-xs h-7 max-w-sm text-primary"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              m.confidence >= 90
                                ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                : "border-amber-300 text-amber-700 bg-amber-50"
                            )}
                          >
                            {m.confidence}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Upload
                </Button>
                <Button size="sm" onClick={() => setStep(3)}>
                  Preview Mapped Template <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 3: SANDBOXED LIVE PREVIEW                       */}
      {/* ==================================================== */}
      {step === 3 && (
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Step 3: Sandboxed Template Preview
              </CardTitle>
              <CardDescription className="text-xs">
                Rendered with simulated local business context data.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Adjust Mappings
              </Button>
              <Button size="sm" onClick={() => setStep(4)}>
                Configure & Register <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg overflow-hidden bg-white shadow-inner h-[600px] w-full">
              <iframe
                title="Template Maker Preview"
                srcDoc={generatePreviewHtml()}
                sandbox="allow-same-origin allow-scripts"
                className="w-full h-full border-0"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================== */}
      {/* STEP 4: REGISTER & PUBLISH CONTROLS                  */}
      {/* ==================================================== */}
      {step === 4 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">
              Step 4: Register New Template
            </CardTitle>
            <CardDescription className="text-xs">
              Configure template metadata, plan permissions, and initial user visibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Template Name</Label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                    }
                  }}
                  placeholder="e.g. Modern Electrician Elite"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Folder Slug ID</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="e.g. electrician-elite"
                  required
                />
                <span className="text-[10px] text-muted-foreground font-mono">
                  Directory: src/templates/{slug || "slug"}/
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category / Trade</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Electrical Services"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Version Tag</Label>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Theme Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="h-8 w-10 p-0 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="font-mono text-xs w-32"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Template Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="High-converting solid layout with emergency dispatch signals."
                />
              </div>
            </div>

            {/* Plan Access Gating */}
            <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-2">
              <Label className="text-xs font-semibold block">Available to Plans</Label>
              <p className="text-[11px] text-muted-foreground">
                Select which subscription tiers can select and build websites with this template:
              </p>
              <div className="grid gap-2 sm:grid-cols-2 pt-1">
                {PLANS.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded border border-border bg-background text-xs cursor-pointer hover:bg-muted/20"
                  >
                    <input
                      type="checkbox"
                      checked={availablePlans.includes(p.id)}
                      onChange={() => togglePlan(p.id)}
                      className="rounded border-border"
                    />
                    <span className="font-medium text-foreground">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* User Visibility Toggle */}
            <div className="p-4 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold block">Visible to Users</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  When enabled, users matching plan criteria can choose this template in the creation wizard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                  isVisible ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                    isVisible ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Preview
              </Button>
              <Button
                size="sm"
                onClick={handleSaveTemplate}
                disabled={isSaving || saveSuccess}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Packaging 7 Template Files...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    Registered Successfully!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save & Generate Template
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
