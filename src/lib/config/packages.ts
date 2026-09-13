export interface PackagePlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingInterval: "month" | "year";
  websiteLimit: number;
  pagesPerSiteLimit: number;
  aiGenerationsLimit: number;
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
}

export const DEFAULT_PACKAGES: PackagePlan[] = [
  {
    id: "plan-starter",
    name: "Starter",
    slug: "starter",
    description: "Ideal for solo tradesmen and individual local contractor sites.",
    price: 29,
    billingInterval: "month",
    websiteLimit: 3,
    pagesPerSiteLimit: 15,
    aiGenerationsLimit: 100,
    features: [
      "Up to 3 Local SEO Websites",
      "15 Pages per Site (Homepage, Services, Areas, Blogs)",
      "Plumber Pro & Water Damage Niche Templates",
      "BYOK AI Content Generation (OpenAI & OpenRouter)",
      "Pure Static HTML/CSS Engine",
      "Instant ZIP Export",
    ],
    isActive: true,
  },
  {
    id: "plan-pro",
    name: "Professional",
    slug: "pro",
    description: "Best for growing home service agencies and multi-location businesses.",
    price: 79,
    billingInterval: "month",
    websiteLimit: 10,
    pagesPerSiteLimit: 35,
    aiGenerationsLimit: 300,
    features: [
      "Up to 10 Local SEO Websites",
      "35 Pages per Site (Full Neighborhood Coverage)",
      "Browser-Based Visual Page Editor",
      "1-Click Save & Re-deploy to Live Storage",
      "Cloudflare R2 Edge Asset Hosting",
      "GitHub Pages, Netlify & Vercel Adapters",
      "Google Rich Snippet Schema.org Automation",
    ],
    isActive: true,
    isPopular: true,
  },
  {
    id: "plan-agency",
    name: "Agency Unlimited",
    slug: "agency",
    description: "Maximum power for SEO agencies building high-velocity client sites.",
    price: 199,
    billingInterval: "month",
    websiteLimit: 50,
    pagesPerSiteLimit: 100,
    aiGenerationsLimit: 1000,
    features: [
      "Up to 50 Client Websites",
      "100 Pages per Site (Mass Entity Geo Coverage)",
      "All Current & Future Niche Templates",
      "Visual Editor with Device Frame Previews",
      "Custom Domain Support",
      "Unlimited Static ZIP Downloads",
      "Priority API Generation Throughput",
    ],
    isActive: true,
  },
];
