import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: website, error } = await supabase
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
        project_id,
        projects (
          id,
          business_name,
          domain,
          phone,
          city,
          state,
          niche,
          description
        )
      `
      )
      .eq("id", websiteId)
      .eq("user_id", user.id)
      .single();

    if (error || !website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    return NextResponse.json({ website });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch website" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: websiteId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: website } = await supabase
      .from("websites")
      .select("id, project_id")
      .eq("id", websiteId)
      .eq("user_id", user.id)
      .single();

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Delete associated pages
    await supabase.from("pages").delete().eq("website_id", websiteId);

    // Delete the website
    const { error: deleteError } = await supabase
      .from("websites")
      .delete()
      .eq("id", websiteId)
      .eq("user_id", user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true, message: "Website deleted successfully" });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete website" },
      { status: 500 }
    );
  }
}
