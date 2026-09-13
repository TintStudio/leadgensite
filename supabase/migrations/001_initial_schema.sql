-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'suspended')),
  plan_id UUID,
  ai_provider TEXT CHECK (ai_provider IN ('openai', 'openrouter')),
  ai_api_key_encrypted TEXT,
  ai_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to automatically create a user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. TEMPLATES (Design metadata)
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  directory_name TEXT NOT NULL,
  page_types TEXT[] NOT NULL DEFAULT ARRAY['homepage', 'service', 'service-area', 'contact']::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BLUEPRINTS & SECTIONS
CREATE TABLE IF NOT EXISTS public.blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  niche TEXT,
  page_type TEXT NOT NULL CHECK (page_type IN ('service', 'service-area', 'homepage', 'contact')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blueprint_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  section_purpose TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  entities TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  suggested_length TEXT,
  tone TEXT,
  link_targets TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  ai_instructions TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 4. PROMPTS
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  page_type TEXT NOT NULL CHECK (page_type IN ('homepage', 'service', 'service-area', 'contact', 'seo_metadata', 'faq', 'rewrite')),
  niche TEXT,
  system_message TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  output_schema JSONB,
  variables TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  website_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  niche TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  business_hours JSONB,
  social_profiles JSONB,
  google_business_url TEXT,
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. WEBSITES
CREATE TABLE IF NOT EXISTS public.websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id),
  brand_settings JSONB DEFAULT '{}'::JSONB,
  navigation_data JSONB DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'generated', 'error')),
  storage_path TEXT,
  total_pages INTEGER NOT NULL DEFAULT 0,
  build_hash TEXT,
  zip_path TEXT,
  zip_build_hash TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_keyword TEXT NOT NULL,
  secondary_keywords TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  slug TEXT NOT NULL,
  generate_page BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_menu BOOLEAN NOT NULL DEFAULT TRUE,
  show_on_homepage BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_footer BOOLEAN NOT NULL DEFAULT TRUE,
  blueprint_id UUID REFERENCES public.blueprints(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SERVICE AREAS
CREATE TABLE IF NOT EXISTS public.service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  primary_keyword TEXT NOT NULL,
  slug TEXT NOT NULL,
  generate_page BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_menu BOOLEAN NOT NULL DEFAULT TRUE,
  show_on_homepage BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  review_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PAGES (Page Registry & Content Data Source of Truth)
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL CHECK (page_type IN ('homepage', 'service', 'service-area', 'contact')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  file_path TEXT,
  content_data JSONB,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'edited', 'error')),
  content_hash TEXT,
  published_hash TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IN ('service', 'service_area')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Helpful indices
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON public.websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_project_id ON public.websites(project_id);
CREATE INDEX IF NOT EXISTS idx_services_project_id ON public.services(project_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_project_id ON public.service_areas(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_website_id ON public.pages(website_id);
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON public.pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(website_id, slug);
