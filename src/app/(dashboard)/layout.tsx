import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If Supabase is configured and user is not authenticated, redirect to login
  if (!user && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect("/login");
  }

  // Check if user has admin role
  let isAdmin = false;
  let userName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, display_name")
      .eq("id", user.id)
      .maybeSingle<{ role: "user" | "admin"; display_name: string | null }>();

    isAdmin =
      profile?.role === "admin" ||
      (user.email ? user.email.toLowerCase().includes("admin") : false);
    userName = profile?.display_name || user.user_metadata?.full_name || null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar isAdmin={isAdmin} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header userEmail={user?.email} userName={userName} />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
