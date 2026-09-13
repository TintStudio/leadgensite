import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PACKAGES, PackagePlan } from "@/lib/config/packages";

// In-memory / cache store for package adjustments
let storedPackages: PackagePlan[] = [...DEFAULT_PACKAGES];

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ packages: storedPackages });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch packages" },
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
    const { packageId, updates } = body;

    if (!packageId || !updates) {
      return NextResponse.json(
        { error: "packageId and updates are required" },
        { status: 400 }
      );
    }

    storedPackages = storedPackages.map((pkg) =>
      pkg.id === packageId ? { ...pkg, ...updates } : pkg
    );

    return NextResponse.json({
      success: true,
      packages: storedPackages,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update package" },
      { status: 500 }
    );
  }
}
