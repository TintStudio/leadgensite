import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";
import { buildTemplateBundle, SuggestedMapping } from "@/lib/templates/analyzer";
import { addTemplate } from "@/lib/config/templates-server";

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
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      category,
      niche,
      description,
      colorHex,
      colorName,
      isActive,
      version,
      availablePlans,
      rawHtml,
      rawCss,
      approvedMappings,
    } = body;

    if (!name || !slug || !rawHtml) {
      return NextResponse.json(
        { error: "Template Name, Slug, and HTML content are required." },
        { status: 400 }
      );
    }

    const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // 1. Build the 7 Handlebars files + CSS
    const bundle = buildTemplateBundle(
      rawHtml,
      rawCss || "",
      (approvedMappings as SuggestedMapping[]) || [],
      colorHex || "#1e3a8a"
    );

    // 2. Write files to src/templates/<slug>/
    const templateDir = path.join(process.cwd(), "src", "templates", sanitizedSlug);
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }

    fs.writeFileSync(path.join(templateDir, "layout.hbs"), bundle.layoutHbs, "utf8");
    fs.writeFileSync(path.join(templateDir, "homepage.hbs"), bundle.homepageHbs, "utf8");
    fs.writeFileSync(path.join(templateDir, "service-page.hbs"), bundle.servicePageHbs, "utf8");
    fs.writeFileSync(path.join(templateDir, "service-area-page.hbs"), bundle.serviceAreaPageHbs, "utf8");
    fs.writeFileSync(path.join(templateDir, "blog-page.hbs"), bundle.blogPageHbs, "utf8");
    fs.writeFileSync(path.join(templateDir, "contact-page.hbs"), bundle.contactPageHbs, "utf8");
    fs.writeFileSync(path.join(templateDir, "style.css"), bundle.styleCss, "utf8");

    // 3. Register in file-based template registry
    const registeredTemplate = addTemplate({
      name,
      slug: sanitizedSlug,
      category: category || "Home Services",
      niche: niche || name,
      description: description || `Custom AI-converted template for ${name}.`,
      directory: sanitizedSlug,
      colorHex: colorHex || "#1e3a8a",
      colorName: colorName || "Theme Primary",
      isActive: Boolean(isActive),
      version: version || "v1",
      availablePlans: Array.isArray(availablePlans) ? availablePlans : ["free", "starter", "pro", "agency"],
    });

    // 4. Try synchronizing with Supabase templates table
    try {
      await supabase.from("templates").upsert(
        {
          name,
          slug: sanitizedSlug,
          description: description || `Custom AI-converted template for ${name}.`,
          directory_name: sanitizedSlug,
          is_active: Boolean(isActive),
          version: version || "v1",
          available_plans: Array.isArray(availablePlans) ? availablePlans : ["free", "starter", "pro", "agency"],
          category: category || "Home Services",
        } as never,
        { onConflict: "slug" }
      );
    } catch (dbErr) {
      console.warn("Could not sync template to database table:", dbErr);
    }

    return NextResponse.json({
      success: true,
      template: registeredTemplate,
    });
  } catch (err: unknown) {
    console.error("Failed to save template maker bundle:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save generated template files" },
      { status: 500 }
    );
  }
}
