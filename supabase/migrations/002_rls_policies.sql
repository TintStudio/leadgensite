-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprint_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. USER PROFILES POLICIES
CREATE POLICY "Users can read own profile or admin can read all"
  ON public.user_profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile or admin can update all"
  ON public.user_profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

-- 2. TEMPLATES POLICIES (Read by all authenticated users, write by admin)
CREATE POLICY "Templates are readable by authenticated users"
  ON public.templates FOR SELECT
  TO authenticated
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Templates manageable by admin"
  ON public.templates FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 3. BLUEPRINTS POLICIES
CREATE POLICY "Blueprints readable by authenticated users"
  ON public.blueprints FOR SELECT
  TO authenticated
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Blueprints manageable by admin"
  ON public.blueprints FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Blueprint sections readable by authenticated users"
  ON public.blueprint_sections FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Blueprint sections manageable by admin"
  ON public.blueprint_sections FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 4. PROMPTS POLICIES
CREATE POLICY "Prompts readable by authenticated users"
  ON public.prompts FOR SELECT
  TO authenticated
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Prompts manageable by admin"
  ON public.prompts FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 5. PROJECTS POLICIES
CREATE POLICY "Users can view own projects or admin can view all"
  ON public.projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects or admin can update all"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own projects or admin can delete all"
  ON public.projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- 6. WEBSITES POLICIES
CREATE POLICY "Users can view own websites or admin can view all"
  ON public.websites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own websites"
  ON public.websites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own websites or admin can update all"
  ON public.websites FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own websites or admin can delete all"
  ON public.websites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- 7. SERVICES POLICIES
CREATE POLICY "Users can view own services"
  ON public.services FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own services"
  ON public.services FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- 8. SERVICE AREAS POLICIES
CREATE POLICY "Users can view own service areas"
  ON public.service_areas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own service areas"
  ON public.service_areas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own service areas"
  ON public.service_areas FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own service areas"
  ON public.service_areas FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- 9. REVIEWS POLICIES
CREATE POLICY "Users can view own reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- 10. PAGES POLICIES
CREATE POLICY "Users can view own pages"
  ON public.pages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own pages"
  ON public.pages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pages"
  ON public.pages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own pages"
  ON public.pages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
