"use client";

import { useState } from "react";
import {
  Plus,
  Eye,
  EyeOff,
  FolderCheck,
  FolderX,
  Palette,
  BookOpen,
  CheckCircle2,
  X,
  Info,
  Sparkles,
} from "lucide-react";
import { TemplateRecord } from "@/lib/config/templates";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EnrichedTemplate extends TemplateRecord {
  directoryExists?: boolean;
  fileCount?: number;
}

interface TemplatesManagerProps {
  initialTemplates: EnrichedTemplate[];
}

export function TemplatesManager({ initialTemplates }: TemplatesManagerProps) {
  const [templates, setTemplates] = useState<EnrichedTemplate[]>(initialTemplates);
  const [activeTab, setActiveTab] = useState<"directory" | "guide">("directory");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Template Form State
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newCategory, setNewCategory] = useState("Home Services");
  const [newNiche, setNewNiche] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColorHex, setNewColorHex] = useState("#2563eb");
  const [newColorName, setNewColorName] = useState("Royal Blue");
  const [newIsActive, setNewIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle Visibility (Visible to Users vs Admin Only)
  const handleToggleVisibility = async (template: EnrichedTemplate) => {
    try {
      const updatedActive = !template.isActive;
      const res = await fetch("/api/admin/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          updates: { isActive: updatedActive },
        }),
      });

      if (!res.ok) throw new Error("Failed to toggle visibility");

      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, isActive: updatedActive } : t))
      );

      setToastMessage(
        updatedActive
          ? `"${template.name}" is now VISIBLE to users in the creation wizard!`
          : `"${template.name}" is now HIDDEN from users (Admin only).`
      );
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update";
      alert(msg);
    }
  };

  // Add New Template
  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) {
      alert("Name and Slug are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim().toLowerCase(),
          category: newCategory.trim(),
          niche: newNiche.trim() || newName.trim(),
          description: newDescription.trim(),
          colorHex: newColorHex,
          colorName: newColorName,
          isActive: newIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add template");

      setTemplates((prev) => [...prev, data.template]);
      setIsAddModalOpen(false);
      setToastMessage(`Template "${newName}" created successfully!`);

      // Reset form
      setNewName("");
      setNewSlug("");
      setNewNiche("");
      setNewDescription("");
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create template";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-300 p-3 rounded-md font-medium animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("directory")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              activeTab === "directory"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            Registered Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              activeTab === "guide"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Template Creator Guide
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/templates/maker"
            className={buttonVariants({
              size: "sm",
              className: "gap-1.5 text-xs font-semibold bg-primary text-primary-foreground",
            })}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Template Maker
          </Link>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Template
          </Button>
        </div>
      </div>

      {/* TAB 1: TEMPLATES DIRECTORY */}
      {activeTab === "directory" && (
        <div className="grid gap-6 md:grid-cols-2">
          {templates.map((tmpl) => (
            <Card
              key={tmpl.id}
              className={`border flex flex-col justify-between transition-all ${
                tmpl.isActive
                  ? "border-border shadow-xs bg-background"
                  : "border-dashed border-border/80 bg-muted/20 opacity-90"
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-border shrink-0 shadow-xs"
                        style={{ backgroundColor: tmpl.colorHex || "#2563eb" }}
                      />
                      {tmpl.name}
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-border">
                        {tmpl.version || "v1"}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] font-medium py-0 h-4 bg-muted">
                        {tmpl.category || "Home Services"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {tmpl.niche}
                      </span>
                    </div>
                  </div>

                  {/* Visibility Status Badge */}
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={tmpl.isActive ? "default" : "secondary"}
                      className={`text-[10px] font-semibold flex items-center gap-1 ${
                        tmpl.isActive ? "bg-emerald-600 hover:bg-emerald-700" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tmpl.isActive ? (
                        <>
                          <Eye className="h-3 w-3" /> Visible to Users
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" /> Hidden (Admin Only)
                        </>
                      )}
                    </Badge>

                    {tmpl.isDefault && (
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">
                        Default
                      </span>
                    )}
                  </div>
                </div>

                <CardDescription className="text-xs mt-2 leading-relaxed">
                  {tmpl.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Folder & Color Details */}
                <div className="p-3 rounded-md border border-border bg-muted/30 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Target Folder:
                    </span>
                    <span className="font-mono text-[11px] text-foreground font-semibold truncate block">
                      src/templates/{tmpl.directory || tmpl.slug}/
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Disk Status:
                    </span>
                    <span className="text-[11px] font-medium flex items-center gap-1">
                      {tmpl.directoryExists ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                          <FolderCheck className="h-3.5 w-3.5" /> Ready ({tmpl.fileCount} files)
                        </span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-1 font-semibold">
                          <FolderX className="h-3.5 w-3.5" /> Folder not created yet
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Plan Access Badges */}
                <div className="flex items-center justify-between text-xs py-1 border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground font-medium">Available to Plans:</span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {(tmpl.availablePlans || ["free", "starter", "pro", "agency"]).map((p) => (
                      <span
                        key={p}
                        className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-semibold bg-primary/10 text-primary border border-primary/20"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Visibility Toggle Action */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    {tmpl.isActive
                      ? "Users can pick this in the creation wizard."
                      : "Only administrators can view this template."}
                  </div>

                  <Button
                    variant={tmpl.isActive ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggleVisibility(tmpl)}
                    className="h-7 text-xs font-semibold gap-1.5"
                  >
                    {tmpl.isActive ? (
                      <>
                        <EyeOff className="h-3 w-3" /> Hide from Users
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" /> Make Visible to Users
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 2: TEMPLATE CREATOR GUIDE */}
      {activeTab === "guide" && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Admin Guide: How to Create & Add New Templates
                </CardTitle>
                <CardDescription className="text-xs">
                  Complete technical specification for creating modular Handlebars templates that integrate seamlessly with the static generation engine.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 text-xs leading-relaxed text-foreground">
            {/* Step 1 */}
            <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  1
                </span>
                Create Template Directory on Disk
              </h3>
              <p className="text-muted-foreground">
                In your project codebase, navigate to <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">src/templates/</code> and create a new folder matching your template slug (e.g., <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">electrician-pro</code>).
              </p>
              <div className="p-2.5 bg-background border border-border rounded font-mono text-[11px] text-muted-foreground">
                src/templates/electrician-pro/
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  2
                </span>
                The 7 Required Files
              </h3>
              <p className="text-muted-foreground">
                Every template must contain exactly these 7 files to compile successfully:
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="p-3 bg-background border border-border rounded space-y-1">
                  <span className="font-mono font-bold text-foreground block">layout.hbs</span>
                  <p className="text-[11px] text-muted-foreground">
                    Master HTML wrapper: &lt;head&gt;, Google Fonts, meta tags, Schema.org JSON-LD, top emergency bar, navigation header, and footer. Contains <code className="font-mono">{"{{{body}}}"}</code>.
                  </p>
                </div>

                <div className="p-3 bg-background border border-border rounded space-y-1">
                  <span className="font-mono font-bold text-foreground block">homepage.hbs</span>
                  <p className="text-[11px] text-muted-foreground">
                    Main landing page: Hero section, why choose us cards, services grid, client testimonials, and FAQs.
                  </p>
                </div>

                <div className="p-3 bg-background border border-border rounded space-y-1">
                  <span className="font-mono font-bold text-foreground block">service-page.hbs</span>
                  <p className="text-[11px] text-muted-foreground">
                    Dedicated trade page: Step-by-step repair process, common problems solved, and pricing/dispatch CTA.
                  </p>
                </div>

                <div className="p-3 bg-background border border-border rounded space-y-1">
                  <span className="font-mono font-bold text-foreground block">service-area-page.hbs</span>
                  <p className="text-[11px] text-muted-foreground">
                    Geo-targeted neighborhood page: Arrival guarantees, localized landmark references, and neighborhood coverage list.
                  </p>
                </div>

                <div className="p-3 bg-background border border-border rounded space-y-1">
                  <span className="font-mono font-bold text-foreground block">blog-page.hbs</span>
                  <p className="text-[11px] text-muted-foreground">
                    Informational article page: Article sections, DIY safety warnings, troubleshooting tips, and call-to-action.
                  </p>
                </div>

                <div className="p-3 bg-background border border-border rounded space-y-1">
                  <span className="font-mono font-bold text-foreground block">contact-page.hbs</span>
                  <p className="text-[11px] text-muted-foreground">
                    Contact & dispatch station: Office address, emergency dispatch notice, business hours, and quote form.
                  </p>
                </div>

                <div className="p-3 bg-background border border-border rounded space-y-1 sm:col-span-2">
                  <span className="font-mono font-bold text-foreground block">style.css</span>
                  <p className="text-[11px] text-muted-foreground">
                    100% pure responsive solid CSS. Use clean solid colors, clear typography, and zero external framework dependencies for maximum loading speed.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Handlebars Cheat Sheet */}
            <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  3
                </span>
                Handlebars Context Variables Cheat Sheet
              </h3>
              <p className="text-muted-foreground">
                Your <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">.hbs</code> files automatically receive these variables during compilation:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border border-border rounded bg-background">
                  <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-2.5 pl-3">Variable Expression</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 pr-3">Example Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-[11px] font-mono">
                    <tr>
                      <td className="p-2.5 pl-3 text-primary">{"{{project.business_name}}"}</td>
                      <td className="font-sans text-muted-foreground">Business company name</td>
                      <td>Apex Plumbing Pro</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-3 text-primary">{"{{project.phone}}"}</td>
                      <td className="font-sans text-muted-foreground">Contact telephone number</td>
                      <td>(555) 019-2834</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-3 text-primary">{"{{phoneLink project.phone}}"}</td>
                      <td className="font-sans text-muted-foreground">Helper: sanitizes phone for tel: link</td>
                      <td>tel:+15550192834</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-3 text-primary">{"{{project.city}}, {{project.state}}"}</td>
                      <td className="font-sans text-muted-foreground">Geographic city and state</td>
                      <td>Arvada, CO</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-3 text-primary">{"{{content.hero.headline}}"}</td>
                      <td className="font-sans text-muted-foreground">AI-generated hero headline</td>
                      <td>24/7 Emergency Plumbers in Arvada</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-3 text-primary">{"{{#each servicesList}}"}</td>
                      <td className="font-sans text-muted-foreground">Iterates all services (name & slug)</td>
                      <td>{"{{this.name}} - /{{this.slug}}"}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-3 text-primary">{"{{#each areasList}}"}</td>
                      <td className="font-sans text-muted-foreground">Iterates all service areas (name & slug)</td>
                      <td>{"{{this.name}} - /{{this.slug}}"}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-3 text-primary">{"{{{schemaJson}}}"}</td>
                      <td className="font-sans text-muted-foreground">Schema.org LocalBusiness JSON-LD (in layout)</td>
                      <td>&lt;script type=&quot;application/ld+json&quot;&gt;</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-3 text-primary">{"{{currentYear}}"}</td>
                      <td className="font-sans text-muted-foreground">Helper: outputs current year</td>
                      <td>2026</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 4: Pro-Tip */}
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-lg text-sky-900 flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 text-sky-700 mt-0.5" />
              <div>
                <span className="font-bold block">Quick Starter Recommendation</span>
                <p className="text-[11px] text-sky-800 mt-0.5">
                  The fastest way to create a new template is to copy an existing folder like <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">src/templates/plumber-pro</code> to <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">src/templates/your-new-slug</code>, adjust the colors in <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">style.css</code>, register it above, and toggle it to <strong>Visible to Users</strong>!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADD NEW TEMPLATE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-lg border border-border bg-background shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Register New Template
                </h2>
                <p className="text-xs text-muted-foreground">
                  Add a new trade design system to the platform compiler.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleAddTemplate} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Template Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                    }
                  }}
                  placeholder="e.g. Electrician Elite"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Folder Slug ID</Label>
                <Input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="e.g. electrician-pro"
                  required
                />
                <span className="text-[10px] text-muted-foreground font-mono">
                  Directory: src/templates/{newSlug || "your-slug"}/
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category</Label>
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Electrical Services"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Theme Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="h-8 w-10 border rounded cursor-pointer p-0"
                    />
                    <Input
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="e.g. Amber Gold"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Niche / Keywords</Label>
                <Input
                  value={newNiche}
                  onChange={(e) => setNewNiche(e.target.value)}
                  placeholder="e.g. Electricians, Panel Upgrades, Lighting, EV Chargers"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe conversion highlights and targeted audience..."
                />
              </div>

              {/* Visibility Switch */}
              <div className="p-3 rounded-md border border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-foreground block">
                    Make Visible to Regular Users
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    If checked, users can immediately pick this template in the creation wizard.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="font-semibold"
                >
                  {isSubmitting ? "Registering..." : "Register Template"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
