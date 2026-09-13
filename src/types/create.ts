export type HostingPlatform = "netlify" | "vercel" | "cloudflare" | "github" | "custom";

export interface ServiceFormData {
  id: string;
  name: string; // Service Title
  keywords?: string[]; // Optional related keywords/entities for this specific service
}

export interface DetailedAreaFormData {
  id: string;
  name: string; // Area / City Name
  city_info?: string; // Optional detailed city/neighborhood information
}

export interface WebsiteCreationFormData {
  // Step 1: Business Information
  business_name: string;
  website_name: string;
  domain: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  niche: string;
  description: string;
  years_in_business: string;
  service_type: string;
  background_info: string; // optional extra context

  // Step 2: Keywords
  target_keyword: string; // Single main target keyword
  secondary_keywords: string[]; // List of secondary/supporting keywords

  // Step 3: Services
  services: ServiceFormData[];

  // Step 4: Service Areas (Both simple multi-line and detailed city info supported)
  service_areas_text: string; // Multi-line raw text
  service_areas: string[]; // Parsed array of names
  detailed_areas: DetailedAreaFormData[]; // Areas with optional city info
  include_zip_codes: boolean;

  // Step 5: Blogs
  blog_titles: string[];

  // Step 6: Template Selection
  template_id: string;

  // Step 7: URL Structure & Hosting Platform
  hosting_platform: HostingPlatform;
  platform_subdomain: string; // for netlify, vercel, cloudflare
  custom_domain: string; // for custom domain
}
