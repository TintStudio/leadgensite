import { createClient } from "@/lib/supabase/server";
import { WebsitesManager, WebsiteItem } from "@/components/websites/websites-manager";

export default async function WebsitesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let websitesList: WebsiteItem[] = [];

  if (user) {
    const { data } = await supabase
      .from("websites")
      .select(
        `
        id,
        status,
        total_pages,
        created_at,
        storage_path,
        template_id,
        brand_settings,
        projects (
          business_name,
          niche,
          domain,
          city,
          state,
          description
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<WebsiteItem[]>();

    if (data) {
      websitesList = data;
    }
  }

  return <WebsitesManager initialWebsites={websitesList} />;
}
