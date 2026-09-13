import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import JSZip from "jszip";
import { analyzeHtmlMarkup, validateZipSecurity } from "@/lib/templates/analyzer";

export const maxDuration = 60;

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Maximum file size: 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 15MB size limit." }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let htmlContent = "";
    let cssContent = "";

    if (fileName.endsWith(".zip")) {
      // 1. In-memory ZIP extraction & security check
      const zip = await JSZip.loadAsync(buffer);
      const securityCheck = validateZipSecurity(zip);

      if (!securityCheck.safe) {
        return NextResponse.json({ error: securityCheck.error || "Unsafe ZIP archive detected." }, { status: 400 });
      }

      // Look for index.html or first .html file
      let targetHtmlFile = zip.file("index.html") || zip.file("index.htm");
      if (!targetHtmlFile) {
        const allHtml = zip.file(/\.html?$/i);
        if (allHtml.length > 0) {
          targetHtmlFile = allHtml[0];
        }
      }

      if (!targetHtmlFile) {
        return NextResponse.json(
          { error: "No HTML file found inside the ZIP archive. Please include an index.html file." },
          { status: 400 }
        );
      }

      htmlContent = await targetHtmlFile.async("string");

      // Look for style.css or any .css file
      const cssFiles = zip.file(/\.css$/i);
      for (const cssFile of cssFiles) {
        const text = await cssFile.async("string");
        cssContent += "\n" + text;
      }
    } else if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
      // 2. Direct HTML file
      htmlContent = buffer.toString("utf8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a .zip archive or an .html file." },
        { status: 400 }
      );
    }

    if (!htmlContent.trim()) {
      return NextResponse.json({ error: "Uploaded HTML file is empty." }, { status: 400 });
    }

    // Run AST & Section analysis
    const analysis = analyzeHtmlMarkup(htmlContent, cssContent);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (err: unknown) {
    console.error("Template analysis error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze template file" },
      { status: 500 }
    );
  }
}
