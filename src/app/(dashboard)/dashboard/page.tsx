import Link from "next/link";
import {
  Globe,
  FileText,
  Rocket,
  FolderKanban,
  Zap,
  Play,
  RotateCcw,
  ArrowRight,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserGreeting } from "@/components/dashboard/user-greeting";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "Partner";
  let sitesGeneratedCount = 0;
  const deploymentsCount = 0;
  let totalProjectsCount = 0;
  let pendingDraftsCount = 0;

  let draftWebsites: Array<{
    id: string;
    domain: string;
    business_name: string;
    niche: string;
    updated_at: string;
  }> = [];

  let recentSites: Array<{
    id: string;
    domain: string;
    business_name: string;
    niche: string;
    created_at: string;
  }> = [];

  if (user) {
    // 1. User Profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle<{ display_name: string | null }>();

    if (profile?.display_name) {
      displayName = profile.display_name.split(" ")[0];
    } else if (user.email) {
      displayName = user.email.split("@")[0];
    }

    // 2. Sites Generated Count
    const { count: genCount } = await supabase
      .from("websites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "generated");
    sitesGeneratedCount = genCount || 0;

    // 3. Projects Count & Drafts
    const { count: projCount } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    totalProjectsCount = projCount || 0;

    const { count: draftCount } = await supabase
      .from("websites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending");
    pendingDraftsCount = draftCount || 0;

    // 4. Draft Websites (Pending)
    const { data: drafts } = await supabase
      .from("websites")
      .select(
        `
        id,
        updated_at,
        projects (
          business_name,
          niche,
          domain
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("updated_at", { ascending: false })
      .limit(3)
      .returns<
        Array<{
          id: string;
          updated_at: string;
          projects: {
            business_name: string;
            niche: string;
            domain: string;
          } | null;
        }>
      >();

    if (drafts) {
      draftWebsites = drafts.map((d) => ({
        id: d.id,
        domain: d.projects?.domain || "draft.site",
        business_name: d.projects?.business_name || "Untitled Draft Site",
        niche: d.projects?.niche || "Local Service",
        updated_at: new Date(d.updated_at).toLocaleDateString(),
      }));
    }

    // 5. Recent Sites
    const { data: recent } = await supabase
      .from("websites")
      .select(
        `
        id,
        created_at,
        projects (
          business_name,
          niche,
          domain
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<
        Array<{
          id: string;
          created_at: string;
          projects: {
            business_name: string;
            niche: string;
            domain: string;
          } | null;
        }>
      >();

    if (recent) {
      recentSites = recent.map((r) => ({
        id: r.id,
        domain: r.projects?.domain || "site.local",
        business_name: r.projects?.business_name || "Untitled Project",
        niche: r.projects?.niche || "Local Service",
        created_at: new Date(r.created_at).toLocaleDateString(),
      }));
    }
  }

  // Chart placeholder months
  const chartMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. Top Welcome Banner Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Dashboard / Overview
              </span>
              <UserGreeting name={displayName} />
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Nice to have you back. Track site generation, deployments, and project progress in one streamlined workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href="/websites"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                View Websites <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
              {draftWebsites.length > 0 && (
                <Link
                  href={`/websites/${draftWebsites[0].id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Resume Draft
                </Link>
              )}
              <Link
                href="/create"
                className={buttonVariants({ size: "sm", className: "bg-primary text-primary-foreground" })}
              >
                <Plus className="mr-1.5 h-4 w-4" /> New Website
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Resume a Draft Section (if any drafts exist) */}
      {draftWebsites.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Resume a draft</h2>
                <span className="text-[11px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {draftWebsites.length}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Pick up where you left off
              </span>
            </div>

            <div className="divide-y divide-border border rounded-md">
              {draftWebsites.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-3.5 px-4 text-xs hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-foreground text-sm">{draft.business_name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {draft.niche} • Updated {draft.updated_at}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/websites/${draft.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm", className: "h-8 text-xs gap-1" })}
                    >
                      <Play className="h-3 w-3" /> Resume
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Four Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sites Generated */}
        <Card className="border-border">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Sites Generated</span>
              <div className="p-1.5 rounded-md bg-muted">
                <Globe className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">{sitesGeneratedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total generated across all projects</p>
            </div>
          </CardContent>
        </Card>

        {/* Deployments */}
        <Card className="border-border">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Deployments</span>
              <div className="p-1.5 rounded-md bg-muted">
                <Rocket className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">{deploymentsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">0 total / 100% active</p>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="border-border">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Projects</span>
              <div className="p-1.5 rounded-md bg-muted">
                <FolderKanban className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">{totalProjectsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingDraftsCount} draft{pendingDraftsCount !== 1 ? "s" : ""} pending
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Generation Quota */}
        <Card className="border-border">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Generation Quota</span>
              <div className="p-1.5 rounded-md bg-muted">
                <Zap className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-foreground">{sitesGeneratedCount}</span>
                <span className="text-xs text-muted-foreground">Unlimited BYOK</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(10, sitesGeneratedCount * 10))}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Direct API key access</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Generation Activity & Recent Sites Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Generation Activity Bar Graph */}
        <Card className="border-border lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-foreground">Generation Activity</h3>
                <p className="text-xs text-muted-foreground">Sites generated over the last 6 months</p>
              </div>
              <span className="text-[11px] font-semibold bg-muted px-2.5 py-1 rounded text-muted-foreground uppercase">
                Last 6 Months
              </span>
            </div>

            {/* Clean solid bar graph without gradients or animations */}
            <div className="h-56 flex items-end justify-between gap-4 pt-8 px-4 border-b border-border">
              {chartMonths.map((m, idx) => {
                const isCurrent = idx === chartMonths.length - 1;
                const heightPercent = isCurrent ? Math.min(100, Math.max(25, sitesGeneratedCount * 25)) : 4;

                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full max-w-[48px] bg-muted rounded-t flex items-end justify-center h-full">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isCurrent ? "bg-primary" : "bg-muted-foreground/20"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{m}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4">
              <span>0 Sites</span>
              <span>Solid light palette • Desktop-first</span>
              <span>{sitesGeneratedCount} Active Site{sitesGeneratedCount !== 1 ? "s" : ""}</span>
            </div>
          </CardContent>
        </Card>

        {/* Right 1 Col: Recent Sites List */}
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Recent Sites</h3>
                <p className="text-xs text-muted-foreground">Your latest generated websites</p>
              </div>
              <Link
                href="/websites"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentSites.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto opacity-30 mb-2" />
                <p className="text-xs font-medium">No sites created yet</p>
                <Link
                  href="/create"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3 text-xs" })}
                >
                  Create your first site
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSites.map((site) => (
                  <Link
                    key={site.id}
                    href={`/websites/${site.id}`}
                    className="block p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground truncate max-w-[180px]">
                        {site.business_name}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {site.created_at}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {site.niche} • {site.domain}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
