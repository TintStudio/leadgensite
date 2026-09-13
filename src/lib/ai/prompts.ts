export interface PromptVariableContext {
  business_name: string;
  website_name?: string;
  domain?: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  niche: string;
  description: string;
  years_in_business?: string;
  background_info?: string;
  target_keyword?: string;
  secondary_keywords?: string[];

  // Page-specific variables
  service_name?: string;
  service_keywords?: string[];
  area_name?: string;
  city_info?: string;
  include_zip_codes?: boolean;
  blog_title?: string;
  services_list?: string[];
  service_areas_list?: string[];
}

/**
 * Replaces placeholders like {{business_name}}, {{city}}, {{target_keyword}} with actual project data.
 */
export function interpolatePrompt(
  template: string,
  context: PromptVariableContext
): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, variableName) => {
    const key = variableName as keyof PromptVariableContext;
    const value = context[key];

    if (value === undefined || value === null) {
      return "";
    }

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    return String(value);
  });
}

/**
 * Standard System Prompt for Local SEO generation.
 */
export const DEFAULT_SYSTEM_PROMPT = `You are an elite Local SEO static website content architect and copywriter.
Your goal is to write authoritative, highly-converting, and natural local business website content.
CRITICAL RULES:
1. ALWAYS return 100% valid JSON matching the exact schema requested.
2. Never include markdown code blocks (such as \`\`\`json) or conversational preamble in your final output. Return ONLY the raw JSON object.
3. Write with high entity density, geo-relevance, and topical authority.
4. Avoid repetitive keyword stuffing. Use natural semantic variations.
5. Highlight emergency availability, licensed credentials, and immediate contact CTAs.
6. STRICT CHARACTER LIMITS — NEVER EXCEED:
   - meta_title: MUST be 70 characters or fewer (aim for 55-65 characters).
   - meta_description: MUST be 155 characters or fewer (aim for 130-150 characters).
   - button_text: Keep concise, 3-5 words max.
   - introduction.content: MUST be a single string (NOT an array). Use paragraph breaks within the string.
7. Always include ALL required fields. Never omit button_text, cta_button_text, or any required field.`;

/**
 * Modular Section Prompts for Homepage Generation
 */

export const HOMEPAGE_SEO_PROMPT = `Generate high-converting, local SEO metadata for the homepage of:
- Business Name: {{business_name}}
- Industry / Niche: {{niche}}
- City & State: {{city}}, {{state}}
- Phone: {{phone}}
- Target Keyword: {{target_keyword}}
- Secondary Keywords: {{secondary_keywords}}

IMPORTANT CHARACTER LIMITS:
- meta_title: MUST be 70 characters or fewer. Count carefully. Aim for 55-65 chars.
- meta_description: MUST be 155 characters or fewer. Count carefully. Aim for 130-150 chars.

Return a JSON object matching this schema:
{
  "meta_title": "Max 65 chars, including primary keyword, city, and business name",
  "meta_description": "140-155 chars highlighting fast emergency dispatch and phone CTA {{phone}}"
}`;

export const HOMEPAGE_HERO_PROMPT = `Generate a high-converting Hero Section (H1 + CTA) for:
- Business Name: {{business_name}}
- Industry / Niche: {{niche}}
- City & State: {{city}}, {{state}}
- Target Keyword: {{target_keyword}}
- Phone: {{phone}}
- Background Info: {{background_info}}

Return a JSON object matching this schema:
{
  "headline": "Magnetic H1 headline incorporating target keyword and city",
  "subheadline": "Compelling 2-sentence value proposition emphasizing speed, reliability, and local authority",
  "cta_button_text": "e.g. Call (555) 000-0000 or Request Service",
  "emergency_badge": "e.g. 24/7 Emergency Dispatch in {{city}}"
}`;

export const HOMEPAGE_ABOUT_PROMPT = `Generate an authentic, trust-building About Business section for:
- Business Name: {{business_name}}
- City & State: {{city}}, {{state}}
- Description / Background: {{description}}
- Years in Business: {{years_in_business}}
- Additional Notes: {{background_info}}

Return a JSON object matching this schema:
{
  "heading": "Authoritative section heading, e.g. Serving {{city}} With Pride & Integrity",
  "story": "2 detailed, persuasive paragraphs explaining the company origins, commitment to local property owners, licensed standards, and dependable workmanship.",
  "bullet_points": [
    "Licensed, Bonded & Insured Technicians",
    "Upfront Transparent Pricing With No Hidden Fees",
    "Rapid Dispatch Across {{city}} & Surrounding Areas",
    "100% Workmanship & Satisfaction Guarantee"
  ],
  "years_experience": "{{years_in_business}} Years"
}`;

export const HOMEPAGE_WHY_US_PROMPT = `Generate a high-converting 'Why Choose Us' differentiators section for:
- Business Name: {{business_name}}
- Industry / Niche: {{niche}}
- City & State: {{city}}, {{state}}
- Target Keyword: {{target_keyword}}
- Secondary Keywords: {{secondary_keywords}}

Return a JSON object matching this schema:
{
  "heading": "Why {{city}} Homeowners & Property Managers Choose {{business_name}}",
  "features": [
    { "title": "Rapid On-Site Arrival", "description": "Guaranteed fast dispatch times when emergency issues threaten your property." },
    { "title": "Certified Master Specialists", "description": "Fully licensed, background-checked technicians equipped with modern diagnostic gear." },
    { "title": "Direct Honest Estimates", "description": "Clear transparent cost breakdowns before any work begins. No surprises." },
    { "title": "Local Reputation & Warranty", "description": "Backed by proven neighborhood reviews and comprehensive labor guarantees." }
  ]
}`;

export const HOMEPAGE_SERVICES_PROMPT = `Generate a structured Services Overview section for:
- Business Name: {{business_name}}
- City & State: {{city}}, {{state}}
- Services List: {{services_list}}
- Target Keyword: {{target_keyword}}

Return a JSON object matching this schema:
{
  "heading": "Professional {{niche}} Solutions in {{city}}",
  "subheading": "Comprehensive commercial and residential services tailored for local standards.",
  "featured_services": [
    {
      "title": "Service Name",
      "short_description": "2-sentence high-intent summary explaining the problem solved and prompt resolution.",
      "slug": "service-slug"
    }
  ]
}`;

export const HOMEPAGE_FAQS_PROMPT = `Generate 5 high-intent, geo-targeted FAQs with authoritative answers for:
- Business Name: {{business_name}}
- Industry / Niche: {{niche}}
- City & State: {{city}}, {{state}}
- Target Keyword: {{target_keyword}}
- Phone: {{phone}}

Return a JSON object matching this schema:
{
  "faqs": [
    {
      "question": "Clear common customer question addressing emergencies, cost, response time, or licensing in {{city}}?",
      "answer": "Detailed, reassuring 3-4 sentence answer highlighting {{business_name}} credentials and calling {{phone}}."
    }
  ]
}`;

export const HOMEPAGE_CTA_PROMPT = `Generate a closing bottom CTA banner for:
- Business Name: {{business_name}}
- City & State: {{city}}, {{state}}
- Phone: {{phone}}

Return a JSON object matching this schema:
{
  "headline": "Need Reliable {{niche}} in {{city}} Right Now?",
  "subheadline": "Our dispatch team is standing by 24/7. Call {{phone}} for immediate priority service.",
  "button_text": "Call {{phone}} Now"
}`;

/**
 * Composite Prompt Template for Full Homepage Generation (Fallback / Bulk mode).
 */
export const HOMEPAGE_PROMPT_TEMPLATE = `Generate comprehensive, conversion-focused homepage content for the following local business:
- Business Name: {{business_name}}
- Industry / Niche: {{niche}}
- City & State: {{city}}, {{state}}
- Phone: {{phone}}
- Target Keyword: {{target_keyword}}
- Secondary Keywords: {{secondary_keywords}}
- Services Offered: {{services_list}}
- Service Areas: {{service_areas_list}}
- Business Background: {{description}}
- Years in Business: {{years_in_business}}
- Additional Notes: {{background_info}}

Return a complete JSON object matching the homepage schema with:
- meta_title (max 65 chars including city & primary service)
- meta_description (140-155 chars with phone CTA)
- hero (headline, subheadline, cta_button_text, emergency_badge)
- about (heading, compelling local story, 4 bullet_points, years_experience)
- services_overview (heading, subheading, featured_services with slug and 2-sentence description)
- why_choose_us (heading, 4 features highlighting fast response and quality)
- faqs (5 detailed FAQs addressing common local customer concerns)
- cta_banner (headline, subheadline, button_text)`;

/**
 * Prompt Template for Service Page Generation.
 */
export const SERVICE_PAGE_PROMPT_TEMPLATE = `Generate a dedicated, high-authority Service Page for:
- Service Title: {{service_name}}
- Business Name: {{business_name}}
- City & State: {{city}}, {{state}}
- Phone: {{phone}}
- Service-Specific Keywords / Entities: {{service_keywords}}
- Global Target Keyword: {{target_keyword}}
- Business Description: {{description}}

IMPORTANT RULES:
- meta_title: MUST be 70 characters or fewer (aim for 55-65). Count carefully.
- meta_description: MUST be 155 characters or fewer (aim for 130-150). Count carefully.
- introduction.content: MUST be a SINGLE STRING (NOT an array). Write 2 detailed paragraphs as one string with line breaks.
- cta_banner.button_text: REQUIRED field. Always include it (e.g. "Call Now", "Get a Free Quote").

Return a complete JSON object matching the service page schema with:
- meta_title (max 65 chars: Service Title | City, State | Business Name)
- meta_description (140-155 chars)
- hero (headline, subheadline, cta_button_text)
- introduction (heading, content as a SINGLE STRING — NOT an array)
- process_steps (4 clear step-by-step restoration/execution steps)
- benefits (4 distinct value points for hiring a professional)
- common_problems_solved (5 specific real-world scenarios or damages)
- faqs (4 technical and pricing/scheduling FAQs)
- cta_banner (headline, subheadline, button_text — ALL REQUIRED)`;

/**
 * Prompt Template for Service Area Page Generation.
 */
export const SERVICE_AREA_PAGE_PROMPT_TEMPLATE = `Generate a geo-targeted Service Area Page for:
- Location / Area: {{area_name}}
- Main City & State: {{city}}, {{state}}
- Business Name: {{business_name}}
- Phone: {{phone}}
- Industry / Trade: {{niche}}
- Target Keyword: {{target_keyword}}
- Specific City Information provided: {{city_info}}
- Include ZIP codes: {{include_zip_codes}}

IMPORTANT RULES:
- meta_title: MUST be 70 characters or fewer (aim for 55-65). Count carefully.
- meta_description: MUST be 155 characters or fewer (aim for 130-150). Count carefully.
- cta_banner.button_text: REQUIRED field. Always include it (e.g. "Call Now", "Get a Free Quote").

Return a complete JSON object matching the service area schema with:
- meta_title (e.g. {{niche}} in {{area_name}}, {{state}} | {{business_name}})
- meta_description (geo-focused with phone CTA)
- hero (headline featuring {{area_name}}, subheadline, cta_button_text)
- local_context (heading, area_summary referencing local neighborhoods, weather and infrastructure relevance)
- services_offered (list of main services delivered to {{area_name}})
- response_guarantee (rapid dispatch and emergency response in {{area_name}})
- faqs (4 location-specific FAQs)
- cta_banner (headline, subheadline, button_text — ALL REQUIRED)`;

/**
 * Prompt Template for Blog Post Generation.
 */
export const BLOG_POST_PROMPT_TEMPLATE = `Generate a comprehensive, SEO-friendly local blog post for:
- Blog Title: {{blog_title}}
- Industry / Niche: {{niche}}
- Primary City & State: {{city}}, {{state}}
- Business Name: {{business_name}}
- Phone: {{phone}}

Return a complete JSON object matching the blog post schema with:
- meta_title
- meta_description
- title (clean engaging title)
- slug (URL-friendly kebab-case)
- read_time (e.g. "6 min read")
- excerpt (2-3 sentence overview)
- sections (3 to 4 sections, each with an H2 heading and 2-3 detailed paragraphs with practical tips)
- conclusion (final takeaways and when to call {{business_name}} at {{phone}})
- faqs (3 common reader questions)`;

/**
 * Prompt Template for Contact Page Generation.
 */
export const CONTACT_PAGE_PROMPT_TEMPLATE = `Generate a high-converting Contact & Emergency Dispatch Page for:
- Business Name: {{business_name}}
- Industry / Niche: {{niche}}
- City & State: {{city}}, {{state}}
- Phone: {{phone}}
- Address: {{address}}
- Business Description: {{description}}

Return a complete JSON object matching the contact page schema with:
- meta_title (Contact & Emergency Dispatch | {{business_name}})
- meta_description (Get in touch with {{business_name}} in {{city}}, {{state}} for immediate local service)
- hero (headline, subheadline)
- office_hours (e.g. 24/7 Emergency Dispatch)
- emergency_notice (priority dispatch statement)
- faqs (3 common questions regarding quotes, response times, and billing)`;


