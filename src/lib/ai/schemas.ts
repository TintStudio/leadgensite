import { z } from "zod";

// 1. Individual Section Schemas for Modular Generation
export const SeoSectionSchema = z.object({
  meta_title: z.string().min(10).max(80),
  meta_description: z.string().min(50).max(170),
});

export const HeroSectionSchema = z.object({
  headline: z.string().min(5),
  subheadline: z.string().min(10),
  cta_button_text: z.string().default("Get Fast Quote"),
  emergency_badge: z.string().optional(),
});

export const AboutSectionSchema = z.object({
  heading: z.string(),
  story: z.string(),
  bullet_points: z.array(z.string()),
  years_experience: z.string().optional(),
});

export const ServicesOverviewSectionSchema = z.object({
  heading: z.string(),
  subheading: z.string(),
  featured_services: z.array(
    z.object({
      title: z.string(),
      short_description: z.string(),
      slug: z.string(),
    })
  ),
});

export const WhyChooseUsSectionSchema = z.object({
  heading: z.string(),
  features: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
});

export const FaqsSectionSchema = z.object({
  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
});

export const CtaBannerSectionSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  button_text: z.string().default("Call Now"),
});

// Schema for Homepage JSON output (composite of all sections)
export const HomepageContentSchema = z.object({
  meta_title: z.string().min(10).max(80),
  meta_description: z.string().min(50).max(170),
  hero: HeroSectionSchema,
  about: AboutSectionSchema,
  services_overview: ServicesOverviewSectionSchema,
  why_choose_us: WhyChooseUsSectionSchema,
  testimonials_intro: z.string().optional(),
  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
  cta_banner: CtaBannerSectionSchema,
});

// Schema for Service Page JSON output
export const ServicePageContentSchema = z.object({
  meta_title: z.string().min(10).max(80),
  meta_description: z.string().min(50).max(170),
  hero: z.object({
    headline: z.string(),
    subheadline: z.string(),
    cta_button_text: z.string().default("Get a Free Quote"),
  }),
  introduction: z.object({
    heading: z.string(),
    content: z.union([z.string(), z.array(z.string())]).transform((v) =>
      Array.isArray(v) ? v.join("\n\n") : v
    ),
  }),
  process_steps: z.array(
    z.object({
      step_number: z.number(),
      title: z.string(),
      description: z.string(),
    })
  ),
  benefits: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
  common_problems_solved: z.array(z.string()),
  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
  cta_banner: z.object({
    headline: z.string(),
    subheadline: z.string(),
    button_text: z.string().default("Call Now"),
  }),
});

// Schema for Service Area Page JSON output
export const ServiceAreaPageContentSchema = z.object({
  meta_title: z.string().min(10).max(80),
  meta_description: z.string().min(50).max(170),
  hero: z.object({
    headline: z.string(),
    subheadline: z.string(),
    cta_button_text: z.string().default("Get a Free Quote"),
  }),
  local_context: z.object({
    heading: z.string(),
    area_summary: z.string(),
    local_relevance: z.string(),
    zip_codes_covered: z.array(z.string()).optional(),
  }),
  services_offered: z.array(
    z.object({
      service_name: z.string(),
      description: z.string(),
      slug: z.string(),
    })
  ),
  response_guarantee: z.object({
    title: z.string(),
    description: z.string(),
  }),
  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
  cta_banner: z.object({
    headline: z.string(),
    subheadline: z.string(),
    button_text: z.string().default("Call Now"),
  }),
});

// Schema for Blog Post JSON output
export const BlogPostContentSchema = z.object({
  meta_title: z.string().min(10).max(80),
  meta_description: z.string().min(50).max(170),
  title: z.string(),
  slug: z.string(),
  read_time: z.string().default("5 min read"),
  excerpt: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      paragraphs: z.array(z.string()),
      bullet_points: z.array(z.string()).optional(),
    })
  ),
  conclusion: z.string(),
  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ).optional(),
});

// Schema for Contact Page JSON output
export const ContactPageContentSchema = z.object({
  meta_title: z.string(),
  meta_description: z.string(),
  hero: z.object({
    headline: z.string(),
    subheadline: z.string(),
  }),
  contact_info: z.object({
    phone: z.string(),
    email: z.string(),
    address: z.string(),
    business_hours: z.string(),
  }),
  emergency_note: z.string().optional(),
});

export type HomepageContent = z.infer<typeof HomepageContentSchema>;
export type ServicePageContent = z.infer<typeof ServicePageContentSchema>;
export type ServiceAreaPageContent = z.infer<typeof ServiceAreaPageContentSchema>;
export type BlogPostContent = z.infer<typeof BlogPostContentSchema>;
export type ContactPageContent = z.infer<typeof ContactPageContentSchema>;
