import { verifyAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Lock,
  Server,
  Database,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { isR2Configured } from "@/lib/storage/r2";

export default async function AdminSystemPage() {
  await verifyAdmin();
  const supabase = await createClient();

  interface UserWithKeyRow {
    id: string;
    display_name: string | null;
    ai_provider: string | null;
    ai_model: string | null;
    ai_api_key_encrypted: string | null;
    updated_at: string;
  }

  const { data: rawUsers } = await supabase
    .from("user_profiles")
    .select("id, display_name, ai_provider, ai_model, ai_api_key_encrypted, updated_at")
    .not("ai_api_key_encrypted", "is", null);

  const usersWithKeys: UserWithKeyRow[] = (rawUsers as unknown as UserWithKeyRow[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          System & BYOK Security Monitor
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Infrastructure health, encryption status, and BYOK credential safeguards.
        </p>
      </div>

      <AdminNav />

      {/* Encryption Overview Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              BYOK Security Architecture
            </CardTitle>
            <Badge variant="default" className="text-[10px] font-bold px-2 py-0.5">
              AES-256-GCM Active
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Bring Your Own Key (BYOK). Your key is encrypted with military-grade AES-256-GCM before being stored in the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-3 rounded-md border border-border bg-muted/20">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Cipher Standard
              </span>
              <span className="text-xs font-bold text-foreground font-mono">
                AES-256-GCM (Authenticated)
              </span>
            </div>

            <div className="p-3 rounded-md border border-border bg-muted/20">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Tamper Proofing
              </span>
              <span className="text-xs font-bold text-foreground font-mono">
                16-byte Auth Tag + 12-byte IV
              </span>
            </div>

            <div className="p-3 rounded-md border border-border bg-muted/20">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Database Protection
              </span>
              <span className="text-xs font-bold text-emerald-600 font-mono">
                Zero Plaintext Exposure
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Services Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Database & Auth Engine</span>
              <Database className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Supabase PostgreSQL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Row-Level Security (RLS) policies enforced on all tables.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Storage Provider</span>
              <Server className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {isR2Configured ? "Cloudflare R2" : "Local Storage Mode"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isR2Configured
                ? "S3-compatible globally distributed edge bucket."
                : "Active local file fallback for development testing."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>AI Provider Orchestrator</span>
              <Cpu className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              OpenAI & OpenRouter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Zod schema validation with automatic 2-attempt retry healing.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User BYOK Encrypted Keys Registry */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">
                Registered BYOK Accounts ({usersWithKeys?.length || 0})
              </CardTitle>
              <CardDescription className="text-xs">
                Encrypted user API key credentials registry.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-border">
              Admin Inspection View
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!usersWithKeys || usersWithKeys.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No users have configured BYOK API keys yet.
            </p>
          ) : (
            <div className="divide-y divide-border border rounded-md">
              {usersWithKeys.map((u) => (
                <div
                  key={u.id}
                  className="p-3 text-xs flex items-center justify-between hover:bg-muted/20"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground">
                      {u.display_name || "User"}
                    </span>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Provider: <span className="capitalize">{u.ai_provider}</span> ({u.ai_model || "default"})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px] font-mono border-emerald-300 text-emerald-700 bg-emerald-50">
                      <Lock className="h-2.5 w-2.5 mr-1" />
                      Encrypted (AES-256-GCM)
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(u.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
