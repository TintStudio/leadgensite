import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderSinglePage } from "@/lib/renderer/engine";
import { uploadFileToStorage } from "@/lib/storage/r2";

interface RouteParams {
  params: Promise<{ id: string; pageId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: websiteId, pageId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify website ownership first
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .select("id")
      .eq("id", websiteId)
      .eq("user_id", user.id)
      .single();

    if (websiteError || !website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const { data: page, error } = await supabase
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .eq("website_id", websiteId)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: websiteId, pageId } = await params;
    const body = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch website and project details
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .select(
        `
        id,
        template_id,
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

    // 2. Fetch existing page
    const { data: existingPage, error: pageError } = await supabase
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .eq("website_id", websiteId)
      .single<{
        id: string;
        website_id: string;
        page_type: "homepage" | "service" | "service-area" | "blog" | "contact";
        title: string;
        slug: string;
        content_data: Record<string, unknown> | null;
        meta_title: string | null;
        meta_description: string | null;
      }>();

    if (pageError || !existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // 3. Update in database
    const updatedContentData = body.content_data || existingPage.content_data || {};
    const updatedMetaTitle =
      body.meta_title !== undefined ? body.meta_title : existingPage.meta_title;
    const updatedMetaDesc =
      body.meta_description !== undefined
        ? body.meta_description
        : existingPage.meta_description;
    const updatedTitle = body.title || existingPage.title;

    const { error: updateError } = await supabase
      .from("pages")
      .update({
        content_data: updatedContentData,
        meta_title: updatedMetaTitle,
        meta_description: updatedMetaDesc,
        title: updatedTitle,
        status: "edited",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", pageId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update page in database" },
        { status: 500 }
      );
    }

    // 4. Re-compile static HTML via Handlebars
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
      templateId: website.template_id || "plumber-pro",
      project: website.projects,
      page: {
        id: existingPage.id,
        page_type: existingPage.page_type,
        title: updatedTitle,
        slug: existingPage.slug,
        content_data: updatedContentData,
        meta_title: updatedMetaTitle || undefined,
        meta_description: updatedMetaDesc || undefined,
      },
      servicesList: (services || []).map((s) => ({ name: s.name, slug: s.slug })),
      areasList: (areas || []).map((a) => ({ name: a.area_name, slug: a.slug })),
    });

    // 5. Upload newly compiled static HTML to storage
    await uploadFileToStorage(
      `websites/${websiteId}/${rendered.filePath}`,
      rendered.html,
      "text/html; charset=utf-8"
    );

    return NextResponse.json({
      success: true,
      message: "Page updated, re-compiled, and deployed to storage successfully.",
      filePath: rendered.filePath,
      page: {
        ...existingPage,
        title: updatedTitle,
        content_data: updatedContentData,
        meta_title: updatedMetaTitle,
        meta_description: updatedMetaDesc,
        status: "edited",
      },
    });
  } catch (err: unknown) {
    console.error("Page update error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save and re-compile page" },
      { status: 500 }
    );
  }
}
