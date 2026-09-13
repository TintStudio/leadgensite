import { NextResponse } from "next/server";
import { getActiveTemplates } from "@/lib/config/templates-server";

export async function GET() {
  try {
    const activeTemplates = getActiveTemplates();
    return NextResponse.json({ templates: activeTemplates });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch active templates" },
      { status: 500 }
    );
  }
}
