"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe,
  FileText,
  CheckCircle2,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  Plus,
  Rocket,
  Eye,
  RefreshCw,
  FolderKanban,
  FilePlus2,
  Download,
  Trash2,
  Lock,
  Palette,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GenerationProgressModal } from "./generation-progress-modal";

export interface WebsiteItem {
  id: string;
  status: string;
  total_pages: number;
  created_at: string;
  storage_path?: string | null;
  template_id?: string | null;
  brand_settings?: Record<string, unknown> | null;
  projects: {
    business_name: string;
    niche: string;
    domain: string;
    city: string;
    state: string;
    description?: string;
  } | null;
}

interface WebsitesManagerProps {
  initialWebsites: WebsiteItem[];
}

export function WebsitesManager({ initialWebsites }: WebsitesManagerProps) {
  const router = useRouter();
  const [websites, setWebsites] = useState<WebsiteItem[]>(initialWebsites);
  const [activeScope, setActiveScope] = useState<"All" | "Citywide" | "Statewide" | "Nationwide">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // State for Regenerate Modal
  const [regeneratingSite, setRegeneratingSite] = useState<WebsiteItem | null>(null);

  // State for Delete Confirmation Modal
  const [deletingSite, setDeletingSite] = useState<WebsiteItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Calculate Metrics matching Screenshot 2
  const totalWebsitesCount = websites.length;
  const totalPagesCount = websites.reduce((acc, curr) => acc + (curr.total_pages || 0), 0);
  const deployedCount = websites.filter(
    (w) => w.status === "deployed" || w.brand_settings?.is_deployed === true
  ).length;
  const undeployedCount = totalWebsitesCount - deployedCount;

  // Filtered Websites
  const filteredWebsites = useMemo(() => {
    return websites.filter((site) => {
      const p = site.projects;
      const name = p?.business_name?.toLowerCase() || "";
      const domain = p?.domain?.toLowerCase() || "";
      const niche = p?.niche?.toLowerCase() || "";
      const city = p?.city?.toLowerCase() || "";
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        domain.includes(q) ||
        niche.includes(q) ||
        city.includes(q);

      if (!matchesSearch) return false;

      if (activeScope === "All") return true;
      const scopeType = (site.brand_settings?.scope as string) || "Citywide";
      return scopeType.toLowerCase() === activeScope.toLowerCase();
    });
  }, [websites, searchQuery, activeScope]);

  // Handle direct ZIP download
  const handleDownload = async (site: WebsiteItem) => {
    try {
      setDownloadingId(site.id);
      const res = await fetch(`/api/websites/${site.id}/download`);
      if (!res.ok) {
        throw new Error("Failed to generate zip file");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${site.projects?.domain || "website"}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Delete Website
  const handleDeleteConfirm = async () => {
    if (!deletingSite) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/websites/${deletingSite.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete website");
      }
      setWebsites((prev) => prev.filter((w) => w.id !== deletingSite.id));
      setDeletingSite(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // Avatar initials generator
  const getInitials = (name?: string) => {
    if (!name) return "WS";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Create Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Websites
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalWebsitesCount} websites generated. Edit content, download ZIP files,
            delete old sites, and quickly deploy undeployed websites.
          </p>
        </div>
        <div>
          <Link
            href="/create"
            className={buttonVariants({
              size: "default",
              className: "gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs",
            })}
          >
            <Plus className="h-4 w-4" />
            Create New Website
          </Link>
        </div>
      </div>

      {/* 2. Top Stats Cards (4 Cards matching Screenshot 2) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Card 1: TOTAL WEBSITES */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Websites
            </p>
            <p className="text-2xl font-black text-foreground">{totalWebsitesCount}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              All time
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Globe className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: TOTAL PAGES */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Pages
            </p>
            <p className="text-2xl font-black text-foreground">{totalPagesCount}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              Across all sites
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: DEPLOYED */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Deployed
            </p>
            <p className="text-2xl font-black text-foreground">{deployedCount}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live websites
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: UNDEPLOYED */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Undeployed
            </p>
            <p className="text-2xl font-black text-foreground">{undeployedCount}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Not yet deployed
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar (Scope Pills, Search Box & View Switcher) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        {/* Scope Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["All", "Citywide", "Statewide", "Nationwide"] as const).map((scope) => (
            <button
              key={scope}
              onClick={() => setActiveScope(scope)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors border ${
                activeScope === scope
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                  : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              {scope}
            </button>
          ))}
        </div>

        {/* Search & Layout Toggles */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search websites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs bg-background border-border"
            />
          </div>

          <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-muted text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-muted text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Website Cards Grid / List */}
      {filteredWebsites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Globe className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No websites found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No websites match your search "${searchQuery}".`
              : "You have not created any websites under this filter yet."}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {filteredWebsites.map((site) => {
            const project = site.projects;
            const scope = (site.brand_settings?.scope as string) || "Citywide";
            const template = site.template_id || "theme-3";
            const isGenerated = site.status === "generated" || site.status === "deployed";

            return (
              <div
                key={site.id}
                className="rounded-2xl border border-border bg-card shadow-2xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                {/* Top Section */}
                <div className="p-5 space-y-4">
                  {/* Scope Badge */}
                  <div>
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary bg-primary/5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                    >
                      {scope}
                    </Badge>
                  </div>

                  {/* Avatar + Title + Subtitle */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-foreground text-sm border border-border">
                      {getInitials(project?.business_name)}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h3 className="font-bold text-foreground text-base truncate">
                        {project?.business_name || "Untitled Website"}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {project?.domain || `${project?.city}, ${project?.state}`}
                      </p>
                    </div>
                  </div>

                  {/* Tags Row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {project?.niche && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground border border-border/60">
                        <Lock className="h-3 w-3" />
                        {project.niche}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground border border-border/60">
                      <Palette className="h-3 w-3" />
                      {template}
                    </span>
                  </div>

                  {/* Micro-Metrics Row */}
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3 grid grid-cols-3 text-center divide-x divide-border/60">
                    <div className="px-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">
                        Pages
                      </p>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {site.total_pages || 0}
                      </p>
                    </div>
                    <div className="px-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">
                        Built
                      </p>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {isGenerated ? (
                          <span className="text-emerald-600 font-semibold">Ready</span>
                        ) : (
                          <span className="text-amber-500 font-semibold capitalize">
                            {site.status}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="px-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">
                        Cost
                      </p>
                      <p className="text-sm font-bold text-foreground mt-0.5">$ --</p>
                    </div>
                  </div>

                  {/* Created Timestamp */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(site.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Matrix (Matching Screenshot 2) */}
                <div className="border-t border-border bg-muted/10 divide-y divide-border">
                  {/* Row 1: Edit & Deploy, Preview, Regenerate, Manage Pages */}
                  <div className="grid grid-cols-4 divide-x divide-border text-center">
                    <Link
                      href={`/websites/${site.id}/editor`}
                      className="p-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
                      title="Edit & Deploy"
                    >
                      <Rocket className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">Edit & Deploy</span>
                    </Link>

                    <a
                      href={`/api/websites/${site.id}/preview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center gap-1"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">Preview</span>
                    </a>

                    <button
                      onClick={() => setRegeneratingSite(site)}
                      className="p-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center gap-1"
                      title="Regenerate"
                    >
                      <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">Regenerate</span>
                    </button>

                    <Link
                      href={`/websites/${site.id}`}
                      className="p-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center gap-1"
                      title="Manage Pages"
                    >
                      <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">Manage</span>
                    </Link>
                  </div>

                  {/* Row 2: Add Pages, Download ZIP, Delete */}
                  <div className="grid grid-cols-3 divide-x divide-border text-center">
                    <Link
                      href={`/websites/${site.id}`}
                      className="p-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center gap-1"
                      title="Add Pages"
                    >
                      <FilePlus2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Add Pages</span>
                    </Link>

                    <button
                      onClick={() => handleDownload(site)}
                      disabled={downloadingId === site.id}
                      className="p-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center gap-1"
                      title="Download ZIP"
                    >
                      <Download className="h-3.5 w-3.5 shrink-0" />
                      <span>{downloadingId === site.id ? "Zipping..." : "Download ZIP"}</span>
                    </button>

                    <button
                      onClick={() => setDeletingSite(site)}
                      className="p-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1"
                      title="Delete Website"
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Regenerate Progress Modal (Screenshot 1 Match) */}
      {regeneratingSite && (
        <GenerationProgressModal
          isOpen={true}
          websiteId={regeneratingSite.id}
          websiteName={regeneratingSite.projects?.business_name}
          onComplete={() => {
            setRegeneratingSite(null);
            router.refresh();
          }}
          onClose={() => setRegeneratingSite(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Delete Website</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">
                {deletingSite.projects?.business_name || "this website"}
              </strong>{" "}
              and all of its generated pages?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingSite(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
