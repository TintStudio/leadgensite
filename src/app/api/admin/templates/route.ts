import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAllTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/config/templates-server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    const isAdmin =
      profile?.role === "admin" ||
      (user.email ? user.email.toLowerCase().includes("admin") : false);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const templates = getAllTemplates();

    // Check directory existence on disk for each template
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

    return NextResponse.json({ templates: enriched });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    const isAdmin =
      profile?.role === "admin" ||
      (user.email ? user.email.toLowerCase().includes("admin") : false);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, category, niche, description, colorHex, colorName, isActive, version, availablePlans, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Template name and slug are required." },
        { status: 400 }
      );
    }

    const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const created = addTemplate({
      name,
      slug: sanitizedSlug,
      category: category || "Home Services",
      niche: niche || name,
      description: description || `Tailored high-conversion template for ${name}.`,
      directory: sanitizedSlug,
      colorHex: colorHex || "#2563eb",
      colorName: colorName || "Custom Accent",
      isActive: Boolean(isActive),
      version: version || "v1",
      availablePlans: Array.isArray(availablePlans) ? availablePlans : ["free", "starter", "pro", "agency"],
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    });

    return NextResponse.json({
      success: true,
      template: created,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create template" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    const isAdmin =
      profile?.role === "admin" ||
      (user.email ? user.email.toLowerCase().includes("admin") : false);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { templateId, updates } = body;

    if (!templateId || !updates) {
      return NextResponse.json(
        { error: "templateId and updates are required" },
        { status: 400 }
      );
    }

    const updated = updateTemplate(templateId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      template: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    const isAdmin =
      profile?.role === "admin" ||
      (user.email ? user.email.toLowerCase().includes("admin") : false);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const templateId = url.searchParams.get("id");

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const ok = deleteTemplate(templateId);
    return NextResponse.json({ success: ok });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete template" },
      { status: 500 }
    );
  }
}
