import Link from "next/link";
import {
  Users,
  Globe,
  Briefcase,
  Server,
  ArrowRight,
  Shield,
} from "lucide-react";
import { verifyAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isR2Configured } from "@/lib/storage/r2";

export default async function AdminDashboardPage() {
  const { user } = await verifyAdmin();
  const supabase = await createClient();

  // 1. Fetch Aggregated Metrics
  const { count: totalUsers } = await supabase
    .from("user_profiles")
    .select("id", { count: "exact", head: true });

  const { count: totalWebsites } = await supabase
    .from("websites")
    .select("id", { count: "exact", head: true });

  const { count: totalProjects } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true });

  // 2. Fetch Recent Users
  const { data: recentUsers } = await supabase
    .from("user_profiles")
    .select("id, display_name, role, status, created_at")
    .order("created_at", { ascending: false })
    .limit(6)
    .returns<
      Array<{
        id: string;
        display_name: string | null;
        role: "user" | "admin";
        status: "active" | "blocked" | "suspended";
        created_at: string;
      }>
    >();

  // 3. Fetch Recent Websites
  const { data: recentWebsites } = await supabase
    .from("websites")
    .select(
      `
      id,
      status,
      total_pages,
      template_id,
      created_at,
      projects (
        business_name,
        domain
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(6)
    .returns<
      Array<{
        id: string;
        status: string;
        total_pages: number;
        template_id: string;
        created_at: string;
        projects: {
          business_name: string;
          domain: string;
        } | null;
      }>
    >();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Administration Console
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Platform governance, user moderation, packages, niche templates, and AI prompts.
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs font-mono border-border">
          Admin: {user.email}
        </Badge>
      </div>

      {/* Admin Navigation */}
      <AdminNav />

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Registered Users</span>
              <Users className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {totalUsers || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Active platform accounts</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Generated Websites</span>
              <Globe className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {totalWebsites || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Static SEO sites built</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Projects</span>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {totalProjects || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Client business campaigns</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Storage Architecture</span>
              <Server className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-base font-semibold text-foreground truncate">
              {isR2Configured ? "Cloudflare R2" : "Local Storage"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isR2Configured ? "Production edge S3 bucket" : "Development fallback mode"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold">Recent Registrations</CardTitle>
              <CardDescription className="text-xs">Latest user signups on platform</CardDescription>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {!recentUsers || recentUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No users registered yet.</p>
            ) : (
              <div className="divide-y divide-border border rounded-md">
                {recentUsers.map((u) => (
                  <div key={u.id} className="p-3 text-xs flex items-center justify-between hover:bg-muted/30">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground">
                        {u.display_name || "Unnamed User"}
                      </span>
                      <p className="text-[11px] font-mono text-muted-foreground">ID: {u.id.slice(0, 8)}...</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                        className="text-[10px] uppercase font-mono"
                      >
                        {u.role}
                      </Badge>
                      <Badge
                        variant={u.status === "active" ? "outline" : "destructive"}
                        className="text-[10px] capitalize"
                      >
                        {u.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Websites */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold">Latest Generated Websites</CardTitle>
              <CardDescription className="text-xs">Recent static SEO compilations</CardDescription>
            </div>
            <Link
              href="/websites"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              All Sites <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {!recentWebsites || recentWebsites.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No websites generated yet.</p>
            ) : (
              <div className="divide-y divide-border border rounded-md">
                {recentWebsites.map((site) => (
                  <div key={site.id} className="p-3 text-xs flex items-center justify-between hover:bg-muted/30">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground">
                        {site.projects?.business_name || "Website"}
                      </span>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {site.projects?.domain || "No domain"} • {site.template_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {site.total_pages} pages
                      </span>
                      <Badge
                        variant={site.status === "generated" ? "secondary" : "outline"}
                        className="text-[10px] capitalize"
                      >
                        {site.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
