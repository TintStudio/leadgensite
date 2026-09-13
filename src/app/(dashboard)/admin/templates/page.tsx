import { verifyAdmin } from "@/lib/auth/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { TemplatesManager } from "@/components/admin/templates-manager";
import { getAllTemplates } from "@/lib/config/templates-server";
import { LayoutTemplate } from "lucide-react";
import fs from "fs";
import path from "path";

export default async function AdminTemplatesPage() {
  await verifyAdmin();

  const templates = getAllTemplates();

  // Enrich with disk folder check
  const enriched = templates.map((t) => {
    const templateDir = path.join(process.cwd(), "src", "templates", t.directory || t.id);
    const exists = fs.existsSync(templateDir);
    let fileCount = 0;
    if (exists) {
      try {
        fileCount = fs.readdirSync(templateDir).length;
      } catch {}
    }
    return {
      ...t,
      directoryExists: exists,
      fileCount,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6 text-primary" />
          Niche Templates Directory & Manager
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Register new templates, toggle user visibility, and inspect template guidelines.
        </p>
      </div>

      <AdminNav />

      <TemplatesManager initialTemplates={enriched} />
    </div>
  );
}
