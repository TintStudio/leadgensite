import { verifyAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { UsersTable, AdminUserItem } from "@/components/admin/users-table";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
  await verifyAdmin();
  const supabase = await createClient();

  // Fetch all user profiles
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, display_name, role, status, plan_id, created_at, updated_at")
    .order("created_at", { ascending: false })
    .returns<Array<{
      id: string;
      display_name: string | null;
      role: "user" | "admin";
      status: "active" | "blocked" | "suspended";
      plan_id: string | null;
      created_at: string;
    }>>();

  // Fetch website counts
  const { data: websites } = await supabase
    .from("websites")
    .select("user_id")
    .returns<Array<{ user_id: string }>>();

  const countsMap: Record<string, number> = {};
  (websites || []).forEach((w) => {
    countsMap[w.user_id] = (countsMap[w.user_id] || 0) + 1;
  });

  const initialUsers: AdminUserItem[] = (profiles || []).map((p) => ({
    ...p,
    websiteCount: countsMap[p.id] || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          User Management
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View all registered accounts, promote administrators, and manage user access.
        </p>
      </div>

      <AdminNav />

      <UsersTable initialUsers={initialUsers} />
    </div>
  );
}
