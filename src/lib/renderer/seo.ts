export interface SitemapUrlEntry {
  slug: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export function generateSitemapXml(domain: string, pages: SitemapUrlEntry[]): string {
  const cleanDomain = domain.replace(/\/+$/, "");
  const baseUrl = `https://${cleanDomain}`;

  const urls = pages
    .map((p) => {
      const path = p.slug ? `/${p.slug.replace(/^\/+/, "")}` : "";
      const loc = `${baseUrl}${path}`;
      const lastmod = p.lastmod || new Date().toISOString().split("T")[0];
      const priority = p.priority !== undefined ? p.priority : p.slug === "" ? 1.0 : 0.8;
      const changefreq = p.changefreq || (p.slug === "" ? "weekly" : "monthly");

      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function generateRobotsTxt(domain: string): string {
  const cleanDomain = domain.replace(/\/+$/, "");
  return `User-agent: *
Allow: /

Sitemap: https://${cleanDomain}/sitemap.xml
`;
}
