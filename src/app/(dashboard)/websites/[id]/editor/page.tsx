import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VisualEditor } from "@/components/editor/visual-editor";
import { EditablePageData } from "@/components/editor/page-content-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WebsiteEditorPage({ params }: PageProps) {
  const { id: websiteId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  // Fetch website with project details
  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .select(
      `
      id,
      status,
      template_id,
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
      template_id: string;
      projects: {
        id: string;
        business_name: string;
        domain: string;
      } | null;
    }>();

  if (websiteError || !website || !website.projects) {
    return notFound();
  }

  // Fetch all pages for this website
  const { data: pages } = await supabase
    .from("pages")
    .select("id, website_id, page_type, title, slug, meta_title, meta_description, content_data, status, sort_order")
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true })
    .returns<EditablePageData[]>();

  return (
    <div className="-m-6">
      <VisualEditor
        websiteId={website.id}
        businessName={website.projects.business_name}
        domain={website.projects.domain}
        initialPages={pages || []}
      />
    </div>
  );
}
