import { verifyAdmin } from "@/lib/auth/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { PromptsManager } from "@/components/admin/prompts-manager";
import { getActivePromptTemplates } from "@/lib/config/prompts-store";
import { Sparkles } from "lucide-react";

export default async function AdminPromptsPage() {
  await verifyAdmin();

  const initialPrompts = getActivePromptTemplates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Prompts & Instruction Templates
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tune individual section prompts (Meta SEO, Hero H1, About, Why Choose Us, Services, FAQs) and page generators live.
        </p>
      </div>

      <AdminNav />

      <PromptsManager initialPrompts={initialPrompts} />
    </div>
  );
}
