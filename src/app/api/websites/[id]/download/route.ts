import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createWebsiteZip } from "@/lib/storage/export";
import { HostingPlatform } from "@/types/create";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: websiteId } = await params;
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
        status,
        project_id,
        brand_settings,
        projects (
          id,
          business_name,
          domain
        )
      `
      )
      .eq("id", websiteId)
      .eq("user_id", user.id)
      .single<{
        id: string;
        status: string;
        project_id: string;
        brand_settings: Record<string, unknown> | null;
        projects: {
          id: string;
          business_name: string;
          domain: string;
        } | null;
      }>();

    if (websiteError || !website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const domainOrName =
      website.projects?.domain || website.projects?.business_name || "website";
    const platform =
      ((website.brand_settings as Record<string, unknown>)?.hosting_platform as HostingPlatform) || "custom";

    const zipResult = await createWebsiteZip(
      website.id,
      domainOrName,
      platform
    );

    return new NextResponse(zipResult.buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipResult.filename}"`,
        "Content-Length": zipResult.buffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    console.error("ZIP Export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate website ZIP" },
      { status: 500 }
    );
  }
}
