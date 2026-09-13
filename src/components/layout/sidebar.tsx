"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  PlusCircle,
  Settings,
  Shield,
} from "lucide-react";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "My Websites",
      href: "/websites",
      icon: Globe,
      current: pathname.startsWith("/websites"),
    },
    {
      name: "Create Website",
      href: "/create",
      icon: PlusCircle,
      current: pathname.startsWith("/create"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      current: pathname.startsWith("/settings"),
    },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card text-card-foreground">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-foreground">
          <Globe className="h-5 w-5 text-primary" />
          <span>{siteConfig.name}</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.current
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  item.current
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="pt-4 space-y-1">
            <div className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Admin Control Center</span>
            </div>

            <Link
              href="/admin"
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                pathname === "/admin"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>Overview</span>
            </Link>

            <Link
              href="/admin/users"
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                pathname.startsWith("/admin/users")
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>Users</span>
            </Link>

            <Link
              href="/admin/packages"
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                pathname.startsWith("/admin/packages")
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>Plans & Packages</span>
            </Link>

            <Link
              href="/admin/templates"
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                pathname === "/admin/templates"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>Templates</span>
            </Link>

            <Link
              href="/admin/templates/maker"
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                pathname.startsWith("/admin/templates/maker")
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>Template Maker</span>
            </Link>

            <Link
              href="/admin/prompts"
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                pathname.startsWith("/admin/prompts")
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>Prompt Templates</span>
            </Link>

            <Link
              href="/admin/system"
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                pathname.startsWith("/admin/system")
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>System & API Keys</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Footer info */}
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{siteConfig.name} v0.1</p>
        <p className="mt-0.5">Local SEO Static Generator</p>
      </div>
    </aside>
  );
}
