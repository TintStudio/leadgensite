-- ============================================================
-- Admin Update Control System — Supabase Migration
-- ============================================================
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Versioned Admin Configs Table
CREATE TABLE IF NOT EXISTS admin_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Config identity
  config_type TEXT NOT NULL,              -- 'prompt' | 'template' | 'plan' | 'feature' | 'setting'
  config_key TEXT NOT NULL,               -- e.g. 'homepage_seo', 'service', 'plumber-pro'

  -- The actual content/data
  config_data JSONB NOT NULL,             -- Full config payload

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',   -- 'draft' | 'live' | 'archived'

  -- Audience targeting
  audience_type TEXT NOT NULL DEFAULT 'all',   -- 'all' | 'specific_users' | 'specific_plans' | 'none'
  audience_user_ids UUID[] DEFAULT '{}',       -- When audience_type = 'specific_users'
  audience_plan_ids UUID[] DEFAULT '{}',       -- When audience_type = 'specific_plans'

  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,                           -- 'system' | 'section' | 'page' for prompts
  change_notes TEXT,                       -- What changed in this version

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),

  -- Ensure unique active version per config
  UNIQUE(config_type, config_key, version)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_configs_lookup ON admin_configs(config_type, config_key, status);
CREATE INDEX IF NOT EXISTS idx_admin_configs_audience ON admin_configs(audience_type);
CREATE INDEX IF NOT EXISTS idx_admin_configs_status ON admin_configs(status);

-- 2. Publish Audit Log Table
CREATE TABLE IF NOT EXISTS config_publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES admin_configs(id) ON DELETE CASCADE,
  action TEXT NOT NULL,                    -- 'published' | 'rolled_back' | 'archived' | 'draft_saved'
  from_status TEXT,                        -- Previous status
  to_status TEXT,                          -- New status
  audience_type TEXT,
  audience_details JSONB,                  -- Snapshot of who received it
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_config_publish_log_config ON config_publish_log(config_id);
CREATE INDEX IF NOT EXISTS idx_config_publish_log_time ON config_publish_log(performed_at DESC);

-- 3. RLS Policies
ALTER TABLE admin_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_publish_log ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access on admin_configs" ON admin_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can only READ live configs that target them
CREATE POLICY "Users read live configs" ON admin_configs
  FOR SELECT
  USING (
    status = 'live' AND (
      audience_type = 'all'
      OR (audience_type = 'specific_users' AND auth.uid() = ANY(audience_user_ids))
    )
  );

-- Only admins can view publish log
CREATE POLICY "Admin full access on config_publish_log" ON config_publish_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_configs_updated_at
  BEFORE UPDATE ON admin_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_configs_updated_at();
