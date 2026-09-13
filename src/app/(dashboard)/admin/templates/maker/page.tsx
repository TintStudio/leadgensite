import { verifyAdmin } from "@/lib/auth/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { TemplateMaker } from "@/components/admin/template-maker";

export const metadata = {
  title: "Template Maker | Admin Control Center",
  description: "Convert existing HTML/ZIP static sites into dynamic Handlebars templates.",
};

export default async function TemplateMakerPage() {
  await verifyAdmin();

  return (
    <div className="space-y-6">
      <AdminNav />
      <TemplateMaker />
    </div>
  );
}
