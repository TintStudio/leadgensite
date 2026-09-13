import { verifyAdmin } from "@/lib/auth/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { PackagesManager } from "@/components/admin/packages-manager";
import { DEFAULT_PACKAGES } from "@/lib/config/packages";
import { Package } from "lucide-react";

export default async function AdminPackagesPage() {
  await verifyAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Packages & Subscription Tiers
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure platform plans, website quotas, page limits, and feature access.
        </p>
      </div>

      <AdminNav />

      <PackagesManager initialPackages={DEFAULT_PACKAGES} />
    </div>
  );
}
