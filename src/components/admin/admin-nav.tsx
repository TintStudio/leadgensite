"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Globe,
  LayoutTemplate,
  Wand2,
  Megaphone,
  Sliders,
  FileCode,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Plans",
    href: "/admin/packages",
    icon: CreditCard,
  },
  {
    name: "Websites",
    href: "/admin/websites",
    icon: Globe,
  },
  {
    name: "Templates",
    href: "/admin/templates",
    icon: LayoutTemplate,
  },
  {
    name: "Template Maker",
    href: "/admin/templates/maker",
    icon: Wand2,
  },
  {
    name: "What's New",
    href: "/admin/whats-new",
    icon: Megaphone,
  },
  {
    name: "Features",
    href: "/admin/features",
    icon: Sliders,
  },
  {
    name: "Blueprints",
    href: "/admin/blueprints",
    icon: FileCode,
  },
  {
    name: "Prompts",
    href: "/admin/prompts",
    icon: Sparkles,
  },
  {
    name: "Settings",
    href: "/admin/system",
    icon: Settings,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-background mb-6">
      <div className="flex items-center gap-2 overflow-x-auto py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
