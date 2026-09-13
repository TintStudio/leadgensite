import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getActivePromptTemplates,
  updatePromptTemplateById,
  PromptTemplateItem,
} from "@/lib/config/prompts-store";

export type { PromptTemplateItem };

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prompts = getActivePromptTemplates();
    return NextResponse.json({ prompts });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch prompts" },
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
    const { promptId, template } = body;

    if (!promptId || template === undefined) {
      return NextResponse.json(
        { error: "promptId and template are required" },
        { status: 400 }
      );
    }

    const updated = updatePromptTemplateById(promptId, template);

    return NextResponse.json({
      success: updated,
      prompts: getActivePromptTemplates(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update prompt" },
      { status: 500 }
    );
  }
}
