import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFileFromStorage } from "@/lib/storage/r2";
import { renderSinglePage } from "@/lib/renderer/engine";
import fs from "fs";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: websiteId } = await params;
    const url = new URL(request.url);
    const requestedSlug = url.searchParams.get("slug") || "";
    const requestedPath = url.searchParams.get("path") || "";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch website and project
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .select(
        `
        id,
        template_id,
        storage_path,
        project_id,
        projects (
          id,
          business_name,
          domain,
          phone,
          email,
          address,
          city,
          state,
          zip,
          country,
          niche,
          description
        )
      `
      )
      .eq("id", websiteId)
      .eq("user_id", user.id)
      .single<{
        id: string;
        template_id: string;
        storage_path: string | null;
        project_id: string;
        projects: {
          id: string;
          business_name: string;
          domain: string;
          phone: string;
          email?: string;
          address: string;
          city: string;
          state: string;
          zip: string;
          country?: string;
          niche: string;
          description: string;
        } | null;
      }>();

    if (websiteError || !website || !website.projects) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const templateId = website.template_id || "plumber-pro";

    // 1. Handle CSS stylesheet request
    if (requestedPath === "style.css" || url.pathname.endsWith("/style.css")) {
      const storedCss = await getFileFromStorage(`websites/${websiteId}/style.css`);
      if (storedCss) {
        return new NextResponse(storedCss.toString("utf8"), {
          headers: { "Content-Type": "text/css; charset=utf-8" },
        });
      }

      // Fallback: Read template style.css from disk
      const templateDirName = templateId === "water-damage-master" ? "water-damage" : "plumber-pro";
      const localCssPath = path.join(process.cwd(), "src", "templates", templateDirName, "style.css");
      if (fs.existsSync(localCssPath)) {
        const cssContent = fs.readFileSync(localCssPath, "utf8");
        return new NextResponse(cssContent, {
          headers: { "Content-Type": "text/css; charset=utf-8" },
        });
      }
    }

    // 2. Resolve HTML output file path
    let targetFilePath = "index.html";
    if (requestedPath) {
      targetFilePath = requestedPath;
    } else if (requestedSlug && requestedSlug !== "index" && requestedSlug !== "homepage") {
      targetFilePath = `${requestedSlug.replace(/\.html$/, "")}.html`;
    }

    // Try reading compiled file from storage first
    const storedFile = await getFileFromStorage(`websites/${websiteId}/${targetFilePath}`);
    let htmlContent = storedFile ? storedFile.toString("utf8") : "";

    // If file isn't in storage yet or dynamic on-the-fly rendering needed:
    if (!htmlContent) {
      // Find matching page in database
      const normalizedSlug =
        targetFilePath === "index.html" ? "" : targetFilePath.replace(/\.html$/, "");

      const { data: pageRecord } = await supabase
        .from("pages")
        .select("*")
        .eq("website_id", websiteId)
        .or(`slug.eq.${normalizedSlug},slug.eq.${requestedSlug}`)
        .maybeSingle<{
          id: string;
          page_type: "homepage" | "service" | "service-area" | "blog" | "contact";
          title: string;
          slug: string;
          content_data: Record<string, unknown> | null;
          meta_title: string | null;
          meta_description: string | null;
        }>();

      if (pageRecord && pageRecord.content_data) {
        // Fetch services and areas for navigation context
        const { data: services } = await supabase
          .from("services")
          .select("name, slug")
          .eq("project_id", website.project_id)
          .returns<Array<{ name: string; slug: string }>>();

        const { data: areas } = await supabase
          .from("service_areas")
          .select("area_name, slug")
          .eq("project_id", website.project_id)
          .returns<Array<{ area_name: string; slug: string }>>();

        const rendered = renderSinglePage({
          templateId,
          project: website.projects,
          page: {
            id: pageRecord.id,
            page_type: pageRecord.page_type,
            title: pageRecord.title,
            slug: pageRecord.slug,
            content_data: pageRecord.content_data,
            meta_title: pageRecord.meta_title || undefined,
            meta_description: pageRecord.meta_description || undefined,
          },
          servicesList: (services || []).map((s) => ({ name: s.name, slug: s.slug })),
          areasList: (areas || []).map((a) => ({ name: a.area_name, slug: a.slug })),
        });

        htmlContent = rendered.html;
      }
    }

    if (!htmlContent) {
      htmlContent = `<!DOCTYPE html>
<html>
<head><title>Preview Not Available</title></head>
<body style="font-family:sans-serif;padding:40px;text-align:center;color:#475569;">
  <h2>Preview Not Generated Yet</h2>
  <p>Please generate website pages or save this page to preview.</p>
</body>
</html>`;
    }

    // Inject preview base and CSS link override so preview iframe displays perfectly
    const cssEndpoint = `/api/websites/${websiteId}/preview?path=style.css`;
    htmlContent = htmlContent
      .replace(/href="\/style\.css"/g, `href="${cssEndpoint}"`)
      .replace(/href="style\.css"/g, `href="${cssEndpoint}"`);

    // Inject iframe preview helper script to prevent accidental navigation within editor
    const helperScript = `
<script>
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href && (href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:'))) {
          // Allow external link or phone link
        } else {
          e.preventDefault();
        }
      });
    });
  });
</script>
`;
    htmlContent = htmlContent.replace("</body>", `${helperScript}</body>`);

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    console.error("Preview error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to render preview" },
      { status: 500 }
    );
  }
}
