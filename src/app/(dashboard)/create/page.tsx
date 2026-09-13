import { createClient } from "@/lib/supabase/server";
import { CreationWizard } from "@/components/create/creation-wizard";

export default async function CreateWebsitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: "user" | "admin" }>();

    isAdmin = profile?.role === "admin";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Create New Website
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Follow the steps below to configure your business, services, targeted locations, and design.
        </p>
      </div>

      <CreationWizard isAdmin={isAdmin} />
    </div>
  );
}
