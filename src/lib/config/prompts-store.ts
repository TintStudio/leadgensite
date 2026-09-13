import {
  DEFAULT_SYSTEM_PROMPT,
  HOMEPAGE_SEO_PROMPT,
  HOMEPAGE_HERO_PROMPT,
  HOMEPAGE_ABOUT_PROMPT,
  HOMEPAGE_WHY_US_PROMPT,
  HOMEPAGE_SERVICES_PROMPT,
  HOMEPAGE_FAQS_PROMPT,
  HOMEPAGE_CTA_PROMPT,
  HOMEPAGE_PROMPT_TEMPLATE,
  SERVICE_PAGE_PROMPT_TEMPLATE,
  SERVICE_AREA_PAGE_PROMPT_TEMPLATE,
  BLOG_POST_PROMPT_TEMPLATE,
  CONTACT_PAGE_PROMPT_TEMPLATE,
} from "@/lib/ai/prompts";

export interface PromptTemplateItem {
  id: string;
  name: string;
  category: "system" | "section" | "page";
  description: string;
  variables: string[];
  template: string;
}

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplateItem[] = [
  {
    id: "system",
    name: "System Prompt (Core AI Rules)",
    category: "system",
    description: "Core persona, JSON formatting instructions, and entity density guidelines.",
    variables: [],
    template: DEFAULT_SYSTEM_PROMPT,
  },
  // --- Homepage Modular Sections ---
  {
    id: "homepage_seo",
    name: "Homepage: Meta SEO Tags",
    category: "section",
    description: "Generates high-CTR Meta Title & Meta Description targeting primary local keywords.",
    variables: ["business_name", "city", "state", "niche", "target_keyword", "secondary_keywords", "phone"],
    template: HOMEPAGE_SEO_PROMPT,
  },
  {
    id: "homepage_hero",
    name: "Homepage: H1 Hero & CTA",
    category: "section",
    description: "Generates magnetic H1 headline, subheadline value prop, CTA button, and 24/7 badge.",
    variables: ["business_name", "niche", "city", "state", "target_keyword", "phone", "background_info"],
    template: HOMEPAGE_HERO_PROMPT,
  },
  {
    id: "homepage_about",
    name: "Homepage: About Business Story",
    category: "section",
    description: "Generates local company origins, trust credentials, experience, and key bullet points.",
    variables: ["business_name", "city", "state", "description", "years_in_business", "background_info"],
    template: HOMEPAGE_ABOUT_PROMPT,
  },
  {
    id: "homepage_why_us",
    name: "Homepage: Why Choose Us",
    category: "section",
    description: "Generates 4 key local differentiators, arrival guarantees, and licensing trust signals.",
    variables: ["business_name", "niche", "city", "state", "target_keyword", "secondary_keywords"],
    template: HOMEPAGE_WHY_US_PROMPT,
  },
  {
    id: "homepage_services",
    name: "Homepage: Services Overview",
    category: "section",
    description: "Generates section heading, subheading, and high-intent featured service cards with slugs.",
    variables: ["business_name", "niche", "city", "state", "services_list", "target_keyword"],
    template: HOMEPAGE_SERVICES_PROMPT,
  },
  {
    id: "homepage_faqs",
    name: "Homepage: Local SEO FAQs",
    category: "section",
    description: "Generates 5 geo-targeted customer questions and reassuring expert answers.",
    variables: ["business_name", "niche", "city", "state", "target_keyword", "phone"],
    template: HOMEPAGE_FAQS_PROMPT,
  },
  {
    id: "homepage_cta",
    name: "Homepage: Bottom CTA Banner",
    category: "section",
    description: "Generates closing emergency dispatch hook and direct telephone CTA button.",
    variables: ["business_name", "niche", "city", "state", "phone"],
    template: HOMEPAGE_CTA_PROMPT,
  },
  {
    id: "homepage_full",
    name: "Homepage: Full Composite Prompt",
    category: "page",
    description: "Full monolithic prompt template generating all homepage elements in one pass.",
    variables: [
      "business_name",
      "city",
      "state",
      "niche",
      "target_keyword",
      "description",
      "services_list",
      "service_areas_list",
    ],
    template: HOMEPAGE_PROMPT_TEMPLATE,
  },
  {
    id: "service",
    name: "Service Page Prompt",
    category: "page",
    description: "In-depth service breakdown, step-by-step repair process, and common problems.",
    variables: [
      "business_name",
      "city",
      "state",
      "service_name",
      "service_keywords",
      "target_keyword",
    ],
    template: SERVICE_PAGE_PROMPT_TEMPLATE,
  },
  {
    id: "service-area",
    name: "Service Area Page Prompt",
    category: "page",
    description: "Neighborhood geo-targeting, arrival guarantees, and local landmarks.",
    variables: [
      "business_name",
      "city",
      "state",
      "area_name",
      "city_info",
      "target_keyword",
    ],
    template: SERVICE_AREA_PAGE_PROMPT_TEMPLATE,
  },
  {
    id: "blog",
    name: "Blog Post Prompt",
    category: "page",
    description: "Authority informational guides, maintenance tips, and problem diagnosis.",
    variables: [
      "business_name",
      "city",
      "state",
      "blog_title",
      "target_keyword",
    ],
    template: BLOG_POST_PROMPT_TEMPLATE,
  },
  {
    id: "contact",
    name: "Contact Page Prompt",
    category: "page",
    description: "Dispatch desk hours, emergency response notices, and contact information.",
    variables: [
      "business_name",
      "city",
      "state",
      "phone",
      "email",
      "address",
      "description",
    ],
    template: CONTACT_PAGE_PROMPT_TEMPLATE,
  },
];

// In-memory store for modified prompts
let activePromptsStore: PromptTemplateItem[] = [...DEFAULT_PROMPT_TEMPLATES];

export function getActivePromptTemplates(): PromptTemplateItem[] {
  return activePromptsStore;
}

export function getPromptTemplateById(id: string): string {
  const found = activePromptsStore.find((p) => p.id === id);
  return found ? found.template : "";
}

export function updatePromptTemplateById(id: string, newTemplate: string): boolean {
  let updated = false;
  activePromptsStore = activePromptsStore.map((p) => {
    if (p.id === id) {
      updated = true;
      return { ...p, template: newTemplate };
    }
    return p;
  });
  return updated;
}
