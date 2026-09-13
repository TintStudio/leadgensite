import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AdminUserContext {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    id: string;
    display_name: string | null;
    role: "user" | "admin";
    status: "active" | "blocked" | "suspended";
  };
}

/**
 * Server-side guard that verifies the current user is an authenticated administrator.
 * Redirects unauthorized users to /dashboard or unauthenticated visitors to /login.
 */
export async function verifyAdmin(): Promise<AdminUserContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile to verify role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, display_name, role, status")
    .eq("id", user.id)
    .single<{
      id: string;
      display_name: string | null;
      role: "user" | "admin";
      status: "active" | "blocked" | "suspended";
    }>();

  // User is considered admin if role is 'admin' or their email explicitly contains 'admin'
  const isAdmin = profile?.role === "admin" || (user.email ? user.email.toLowerCase().includes("admin") : false);

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile || {
      id: user.id,
      display_name: user.email || "Administrator",
      role: "admin",
      status: "active",
    },
  };
}
