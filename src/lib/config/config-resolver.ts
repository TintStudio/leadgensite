import { createClient } from "@/lib/supabase/server";

/**
 * Shape of a row from the `admin_configs` table.
 */
export interface AdminConfigRow {
  id: string;
  config_type: string;
  config_key: string;
  config_data: Record<string, unknown>;
  version: number;
  status: string;
  audience_type: string;
  audience_user_ids: string[];
  audience_plan_ids: string[];
  name: string;
  description: string | null;
  category: string | null;
  change_notes: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created_by: string | null;
}

/**
 * Resolves the correct config for a given user.
 *
 * Resolution order:
 * 1. LIVE config targeting this specific user → use it
 * 2. LIVE config targeting the user's plan → use it
 * 3. LIVE config with audience_type = 'all' → use it
 * 4. Return null (caller should fall back to hardcoded defaults)
 */
export async function resolveConfig(
  configType: string,
  configKey: string,
  userId?: string,
  userPlanId?: string
): Promise<AdminConfigRow | null> {
  const supabase = await createClient();

  // Fetch all LIVE configs for this type+key, ordered by version desc (latest first)
  const { data: configs } = await supabase
    .from("admin_configs")
    .select("*")
    .eq("config_type", configType)
    .eq("config_key", configKey)
    .eq("status", "live")
    .order("version", { ascending: false })
    .returns<AdminConfigRow[]>();

  if (!configs || configs.length === 0) {
    return null;
  }

  // Priority 1: User-specific targeting
  if (userId) {
    const userSpecific = configs.find(
      (c) =>
        c.audience_type === "specific_users" &&
        c.audience_user_ids.includes(userId)
    );
    if (userSpecific) return userSpecific;
  }

  // Priority 2: Plan-specific targeting
  if (userPlanId) {
    const planSpecific = configs.find(
      (c) =>
        c.audience_type === "specific_plans" &&
        c.audience_plan_ids.includes(userPlanId)
    );
    if (planSpecific) return planSpecific;
  }

  // Priority 3: Global (audience_type = 'all')
  const global = configs.find((c) => c.audience_type === "all");
  return global || null;
}

/**
 * Resolves a prompt template for a given user.
 * Returns the template string, or null if not found in DB (caller uses hardcoded default).
 */
export async function resolvePromptTemplate(
  promptKey: string,
  userId?: string,
  userPlanId?: string
): Promise<string | null> {
  const config = await resolveConfig("prompt", promptKey, userId, userPlanId);
  if (!config) return null;

  // For prompts, config_data stores { template: "..." }
  const template = config.config_data?.template;
  return typeof template === "string" ? template : null;
}

/**
 * Fetches ALL live configs for a given type.
 * Used by admin dashboard for overview.
 */
export async function getAllConfigs(
  configType?: string,
  status?: string
): Promise<AdminConfigRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("admin_configs")
    .select("*")
    .order("config_type", { ascending: true })
    .order("config_key", { ascending: true })
    .order("version", { ascending: false });

  if (configType) {
    query = query.eq("config_type", configType);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data } = await query.returns<AdminConfigRow[]>();
  return data || [];
}

/**
 * Gets the next version number for a config_type + config_key combination.
 */
export async function getNextVersion(
  configType: string,
  configKey: string
): Promise<number> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("admin_configs")
    .select("version")
    .eq("config_type", configType)
    .eq("config_key", configKey)
    .order("version", { ascending: false })
    .limit(1)
    .returns<{ version: number }[]>();

  if (data && data.length > 0) {
    return data[0].version + 1;
  }
  return 1;
}

/**
 * Gets the version history for a config.
 */
export async function getConfigHistory(
  configType: string,
  configKey: string
): Promise<AdminConfigRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("admin_configs")
    .select("*")
    .eq("config_type", configType)
    .eq("config_key", configKey)
    .order("version", { ascending: false })
    .returns<AdminConfigRow[]>();

  return data || [];
}
