import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Globe,
  ArrowLeft,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  MapPin,
  Briefcase,
  Edit3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GenerateWebsiteButton } from "./generate-button";
import { DownloadButton } from "@/components/websites/download-button";
import { DeployDialog } from "@/components/websites/deploy-dialog";
import { HostingPlatform } from "@/types/create";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WebsiteDetailPage({ params }: PageProps) {
  const { id: websiteId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  // Fetch website with project details
  const { data: website } = await supabase
    .from("websites")
    .select(
      `
      id,
      status,
      total_pages,
      storage_path,
      created_at,
      generated_at,
      brand_settings,
      template_id,
      projects (
        id,
        business_name,
        domain,
        phone,
        city,
        state,
        niche
      )
    `
    )
    .eq("id", websiteId)
    .eq("user_id", user.id)
    .single<{
      id: string;
      status: string;
      total_pages: number;
      storage_path: string | null;
      created_at: string;
      generated_at: string | null;
      brand_settings: Record<string, unknown> | null;
      template_id: string;
      projects: {
        id: string;
        business_name: string;
        domain: string;
        phone: string;
        city: string;
        state: string;
        niche: string;
      } | null;
    }>();

  if (!website || !website.projects) {
    return notFound();
  }

  // Fetch generated pages
  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, page_type, status, sort_order, updated_at")
    .eq("website_id", website.id)
    .order("sort_order", { ascending: true })
    .returns<
      Array<{
        id: string;
        title: string;
        slug: string;
        page_type: string;
        status: string;
        sort_order: number;
        updated_at: string;
      }>
    >();

  const project = website.projects;
  const brandSettings = (website.brand_settings as Record<string, unknown>) || {};
  const hostingPlatform = (brandSettings.hosting_platform as HostingPlatform) || "github";

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/websites"
              className={buttonVariants({ variant: "ghost", size: "sm", className: "h-8 px-2" })}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {project.business_name}
            </h1>
            <Badge variant="secondary" className="capitalize text-xs">
              {website.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2 ml-2">
            <span>{project.domain}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {project.city}, {project.state}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {project.niche}
            </span>
          </p>
        </div>

        {/* Action Trigger */}
        <div className="flex items-center gap-3">
          {website.status === "generated" && (
            <>
              <Link
                href={`/websites/${website.id}/editor`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "gap-1.5 font-medium border-border",
                })}
              >
                <Edit3 className="h-4 w-4" />
                Visual Editor
              </Link>
              <DownloadButton
                websiteId={website.id}
                domain={project.domain || project.business_name}
              />
              <DeployDialog
                websiteId={website.id}
                businessName={project.business_name}
                domain={project.domain}
                initialPlatform={hostingPlatform}
              />
            </>
          )}
          <Suspense fallback={null}>
            <GenerateWebsiteButton
              websiteId={website.id}
              currentStatus={website.status}
              websiteName={project.business_name}
            />
          </Suspense>
        </div>
      </div>

      {/* Website Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Generated Pages</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {pages?.length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {website.status === "generated" ? "All pages built" : "Awaiting AI generation"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Template</CardDescription>
            <CardTitle className="text-base font-semibold text-foreground truncate">
              {website.template_id}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Clean, solid layout</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Hosting Target</CardDescription>
            <CardTitle className="text-base font-semibold text-foreground truncate capitalize">
              {hostingPlatform === "github"
                ? "GitHub Pages"
                : hostingPlatform === "cloudflare"
                ? "Cloudflare Pages"
                : hostingPlatform === "netlify"
                ? "Netlify"
                : hostingPlatform === "vercel"
                ? "Vercel"
                : "Custom Host"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground truncate font-mono">
              {project.domain}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Storage Location</CardDescription>
            <CardTitle className="text-base font-semibold text-foreground truncate flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-primary" />
              {website.storage_path ? "Cloudflare R2" : "Pending Sync"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground truncate">
              {website.storage_path || "Generated upon build"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Status</CardDescription>
            <CardTitle className="text-base font-semibold text-foreground capitalize flex items-center gap-1.5">
              {website.status === "generated" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Ready
                </>
              ) : website.status === "generating" ? (
                <>
                  <Sparkles className="h-4 w-4 text-primary animate-spin" />
                  Generating
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-500" />
                  Pending
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {website.generated_at
                ? `Updated ${new Date(website.generated_at).toLocaleDateString()}`
                : "Not yet generated"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pages Breakdown Table */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Website Pages</CardTitle>
              <CardDescription className="text-xs">
                Structured content files for local SEO and keyword rankings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!pages || pages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg p-6">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">No pages generated yet</p>
              <p className="text-xs mt-1 max-w-sm mx-auto">
                Click &quot;Generate Pages with AI&quot; above to run your BYOK model and produce complete structured content for this site.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border border rounded-md">
              {pages.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 px-4 text-xs hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{p.title}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {p.page_type}
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      /{p.slug || ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize text-[11px]">
                      {p.status}
                    </Badge>
                    <Link
                      href={`/websites/${website.id}/editor`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                        className: "h-7 px-2 text-xs text-muted-foreground hover:text-foreground",
                      })}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
