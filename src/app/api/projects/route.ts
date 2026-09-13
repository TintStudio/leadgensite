import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WebsiteCreationFormData } from "@/types/create";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: WebsiteCreationFormData = await request.json();

    // Provide safe defaults for testing if fields are empty
    body.business_name = body.business_name || "Test Local Business";
    body.phone = body.phone || "(555) 000-1234";
    body.address = body.address || "123 Test Street";
    body.city = body.city || "Arvada";
    body.state = body.state || "CO";
    body.zip = body.zip || "80002";
    body.description = body.description || "Test local business description.";

    // Resolve domain
    const platformSuffix =
      body.hosting_platform === "github"
        ? ".github.io"
        : body.hosting_platform === "cloudflare"
        ? ".pages.dev"
        : body.hosting_platform === "vercel"
        ? ".vercel.app"
        : ".netlify.app";

    const resolvedDomain =
      body.hosting_platform === "custom"
        ? body.custom_domain
        : body.domain || `${body.platform_subdomain}${platformSuffix}`;

    // 1. Get or find template
    const templateSlug = body.template_id || "plumber-pro";
    const { data: defaultTemplate } = await supabase
      .from("templates")
      .select("id")
      .eq("slug", templateSlug)
      .maybeSingle<{ id: string }>();

    let templateId = defaultTemplate?.id;

    if (!templateId) {
      const { data: newTemplate } = await supabase
        .from("templates")
        .insert({
          name: templateSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          slug: templateSlug,
          directory_name: templateSlug,
          description: "Template layout",
          is_default: templateSlug === "modern-local-business",
          is_active: true,
        } as never)
        .select("id")
        .single<{ id: string }>();
      templateId = newTemplate?.id;
    }

    // 2. Insert Project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        business_name: body.business_name,
        website_name: body.website_name || body.business_name,
        domain: resolvedDomain,
        phone: body.phone,
        email: body.email || null,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip,
        country: body.country || "US",
        niche: body.service_type || body.niche,
        description: body.description,
        additional_info: body.background_info || null,
        status: "active",
      } as never)
      .select()
      .single<{ id: string }>();

    if (projectError || !project) {
      return NextResponse.json(
        { error: projectError?.message || "Failed to create project" },
        { status: 500 }
      );
    }

    // 3. Insert Services (Title only)
    if (body.services && body.services.length > 0) {
      const servicesToInsert = body.services.map((s, index) => {
        const slug = s.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-");

        const serviceKeywords =
          s.keywords && s.keywords.length > 0
            ? s.keywords
            : body.secondary_keywords || [];

        return {
          project_id: project.id,
          user_id: user.id,
          name: s.name,
          primary_keyword: `${s.name.toLowerCase()} in ${body.city.toLowerCase()}`,
          secondary_keywords: serviceKeywords,
          slug,
          generate_page: true,
          show_in_menu: true,
          show_on_homepage: true,
          show_in_footer: true,
          sort_order: index,
        };
      });

      await supabase.from("services").insert(servicesToInsert as never);
    }

    // 4. Insert Service Areas (From multi-line parsed areas)
    if (body.service_areas && body.service_areas.length > 0) {
      const areasToInsert = body.service_areas.map((areaName, index) => {
        const slug = areaName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-");

        return {
          project_id: project.id,
          user_id: user.id,
          area_name: areaName,
          city: areaName,
          state: body.state,
          zip: body.zip || "",
          primary_keyword: `${body.service_type || body.niche} in ${areaName}`,
          slug: `${slug}-${(body.state || "area").toLowerCase()}`,
          generate_page: true,
          show_in_menu: true,
          show_on_homepage: true,
          sort_order: index,
        };
      });

      await supabase.from("service_areas").insert(areasToInsert as never);
    }

    // 5. Create Website entity in 'pending' state
    const totalPagesToGenerate =
      1 + // Homepage
      (body.services?.length || 0) +
      (body.service_areas?.length || 0) +
      (body.blog_titles?.length || 0) +
      1; // Contact page

    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .insert({
        project_id: project.id,
        user_id: user.id,
        template_id: templateId,
        brand_settings: {
          hosting_platform: body.hosting_platform,
          custom_domain: body.custom_domain,
          platform_subdomain: body.platform_subdomain,
          target_keyword: body.target_keyword,
          secondary_keywords: body.secondary_keywords,
          include_zip_codes: body.include_zip_codes,
          blog_titles: body.blog_titles,
          detailed_areas: body.detailed_areas || [],
          years_in_business: body.years_in_business,
          service_type: body.service_type,
        },
        status: "pending",
        total_pages: totalPagesToGenerate,
      } as never)
      .select()
      .single<{ id: string }>();

    if (websiteError) {
      return NextResponse.json(
        { error: websiteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      websiteId: website?.id,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
