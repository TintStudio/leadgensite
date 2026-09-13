import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin
    const { data: myProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    const isAdmin =
      myProfile?.role === "admin" ||
      (user.email ? user.email.toLowerCase().includes("admin") : false);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all profiles
    const { data: profiles, error } = await supabase
      .from("user_profiles")
      .select("id, display_name, role, status, plan_id, created_at, updated_at")
      .order("created_at", { ascending: false })
      .returns<
        Array<{
          id: string;
          display_name: string | null;
          role: "user" | "admin";
          status: "active" | "blocked" | "suspended";
          plan_id: string | null;
          created_at: string;
          updated_at: string;
        }>
      >();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch website counts grouped by user_id
    const { data: websites } = await supabase
      .from("websites")
      .select("user_id")
      .returns<Array<{ user_id: string }>>();

    const countsMap: Record<string, number> = {};
    (websites || []).forEach((w) => {
      countsMap[w.user_id] = (countsMap[w.user_id] || 0) + 1;
    });

    const enrichedUsers = (profiles || []).map((p) => ({
      ...p,
      websiteCount: countsMap[p.id] || 0,
    }));

    return NextResponse.json({ users: enrichedUsers });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch users" },
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

    const { data: myProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    const isAdmin =
      myProfile?.role === "admin" ||
      (user.email ? user.email.toLowerCase().includes("admin") : false);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, status, plan_id } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;
    if (plan_id !== undefined) updates.plan_id = plan_id;

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update(updates as never)
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update user" },
      { status: 500 }
    );
  }
}
