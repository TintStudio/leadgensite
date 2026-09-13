-- ===========================================
-- MIGRATION 003: Templates, Versioning & Plans Extension
-- ===========================================

-- 1. EXTEND TEMPLATES TABLE
ALTER TABLE public.templates 
  ADD COLUMN IF NOT EXISTS version TEXT NOT NULL DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS available_plans TEXT[] NOT NULL DEFAULT ARRAY['free', 'starter', 'pro', 'agency']::TEXT[],
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General Trade',
  ADD COLUMN IF NOT EXISTS preview_image TEXT;

-- 2. CREATE TEMPLATE_VERSIONS TABLE
CREATE TABLE IF NOT EXISTS public.template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  version_tag TEXT NOT NULL,
  changelog TEXT,
  storage_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_template_version UNIQUE (template_id, version_tag)
);

-- 3. LINK TEMPLATE VERSION TO WEBSITES
ALTER TABLE public.websites
  ADD COLUMN IF NOT EXISTS template_version_id UUID REFERENCES public.template_versions(id) ON DELETE SET NULL;

-- 4. EXTEND USER_PROFILES FOR PLAN MANAGEMENT & SUSPENSION
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS plan_id TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'suspended')),
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 5. RLS POLICIES FOR TEMPLATE_VERSIONS
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active template versions"
  ON public.template_versions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins have full access to template versions"
  ON public.template_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
