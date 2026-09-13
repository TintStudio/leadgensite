-- =========================================================
-- SEED DATA: Default Blueprints & Sections
-- =========================================================

-- 1. Service Page Blueprint
INSERT INTO public.blueprints (id, name, niche, page_type, description, is_default, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Universal Local Service Blueprint',
  'All',
  'service',
  'High-converting structure with process steps, benefits, and technical FAQs',
  TRUE,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.blueprint_sections (blueprint_id, section_name, section_purpose, topics, entities, suggested_length, tone, sort_order)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Hero Banner', 'Capture immediate emergency attention', ARRAY['emergency response', 'licensed experts'], ARRAY['24/7 Service', 'Certified Technicians'], 'Short', 'Authoritative', 1),
  ('11111111-1111-1111-1111-111111111111', 'Service Overview', 'Explain procedure and importance', ARRAY['inspection', 'damage mitigation', 'safety'], ARRAY['IICRC Standards', 'Structural Safety'], 'Medium', 'Informative', 2),
  ('11111111-1111-1111-1111-111111111111', 'Step-by-Step Process', 'Build trust through transparency', ARRAY['assessment', 'action plan', 'completion'], ARRAY['Moisture Meters', 'Industrial Equipment'], 'Medium', 'Professional', 3),
  ('11111111-1111-1111-1111-111111111111', 'Customer FAQs', 'Overcome common objections and pricing worries', ARRAY['pricing', 'insurance billing', 'response time'], ARRAY['Direct Insurance Billing', 'Free Estimates'], 'Medium', 'Helpful', 4)
ON CONFLICT (id) DO NOTHING;

-- 2. Service Area Blueprint
INSERT INTO public.blueprints (id, name, niche, page_type, description, is_default, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Geo-Targeted Neighborhood Blueprint',
  'All',
  'service-area',
  'Hyper-local landing page structure focusing on community relevance',
  TRUE,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.blueprint_sections (blueprint_id, section_name, section_purpose, topics, entities, suggested_length, tone, sort_order)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Local Hero', 'Establish immediate location presence', ARRAY['local dispatch', 'neighborhood coverage'], ARRAY['Local Technicians', 'Rapid Dispatch'], 'Short', 'Urgent', 1),
  ('22222222-2222-2222-2222-222222222222', 'Community Context', 'Highlight local infrastructure and common issues', ARRAY['weather patterns', 'local homes', 'subdivisions'], ARRAY['Older Plumbing', 'Severe Weather'], 'Medium', 'Neighborly', 2),
  ('22222222-2222-2222-2222-222222222222', 'Area Services List', 'Enumerate available services in this city', ARRAY['emergency services', 'full remediation'], ARRAY['Free Local Quotes', 'Fast Arrival'], 'Medium', 'Professional', 3)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- SEED DATA: Default Prompts
-- =========================================================

-- Homepage Prompt
INSERT INTO public.prompts (name, page_type, niche, system_message, prompt_text, version, is_default, is_active)
VALUES (
  'Default Homepage Prompt',
  'homepage',
  'General Local Business',
  'You are an expert Local SEO copywriter. Always output clean, valid JSON matching the schema.',
  'Generate comprehensive homepage content for {{business_name}} in {{city}}, {{state}}. Target keyword: {{target_keyword}}.',
  1,
  TRUE,
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- Service Page Prompt
INSERT INTO public.prompts (name, page_type, niche, system_message, prompt_text, version, is_default, is_active)
VALUES (
  'Default Service Page Prompt',
  'service',
  'General Local Business',
  'You are an expert Local SEO copywriter. Always output clean, valid JSON matching the schema.',
  'Generate service page content for {{service_name}} offered by {{business_name}} in {{city}}, {{state}}.',
  1,
  TRUE,
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- Service Area Prompt
INSERT INTO public.prompts (name, page_type, niche, system_message, prompt_text, version, is_default, is_active)
VALUES (
  'Default Service Area Prompt',
  'service-area',
  'General Local Business',
  'You are an expert Local SEO copywriter. Always output clean, valid JSON matching the schema.',
  'Generate geo-targeted service area content for {{area_name}}, {{state}} by {{business_name}}.',
  1,
  TRUE,
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- Blog Prompt
INSERT INTO public.prompts (name, page_type, niche, system_message, prompt_text, version, is_default, is_active)
VALUES (
  'Default Blog Prompt',
  'faq',
  'General Local Business',
  'You are an expert Local SEO copywriter. Always output clean, valid JSON matching the schema.',
  'Generate an educational, authoritative blog post for {{blog_title}} by {{business_name}}.',
  1,
  TRUE,
  TRUE
) ON CONFLICT (id) DO NOTHING;
