/**
 * Centralized application configuration.
 *
 * All branding and environment-specific values are read from
 * environment variables so the application name, description,
 * and URL can be changed without modifying code.
 */

export const siteConfig = {
  /** Application display name — used in page titles, headers, footer */
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "SiteForge",

  /** Short description — used in meta tags and landing page */
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
    "Create SEO-optimized static websites for local businesses",

  /** Base URL of the application */
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
