import JSZip from "jszip";

export interface DetectedSection {
  id: string;
  name: string;
  description: string;
  detected: boolean;
  elementTag: string;
  snippet: string;
}

export interface SuggestedMapping {
  id: string;
  section: string;
  detectedText: string;
  suggestedVariable: string;
  confidence: number; // 0 to 100
  accepted: boolean;
  notes?: string;
}

export interface AnalysisResult {
  title: string;
  rawHtml: string;
  css: string;
  detectedSections: DetectedSection[];
  suggestedMappings: SuggestedMapping[];
  warnings: string[];
}

/**
 * Validates zip buffer to prevent zip-slip / directory traversal and malicious executables.
 */
export function validateZipSecurity(zip: JSZip): { safe: boolean; error?: string } {
  const disallowedExtensions = [".exe", ".bat", ".sh", ".php", ".py", ".node", ".dll", ".so", ".cmd"];

  for (const relativePath of Object.keys(zip.files)) {
    // 1. Check for directory traversal / zip slip
    if (relativePath.includes("..") || relativePath.startsWith("/") || relativePath.startsWith("\\")) {
      return { safe: false, error: `Suspicious file path detected: ${relativePath}` };
    }

    // 2. Check for executable files
    const lower = relativePath.toLowerCase();
    for (const ext of disallowedExtensions) {
      if (lower.endsWith(ext)) {
        return { safe: false, error: `Prohibited executable file format detected: ${relativePath}` };
      }
    }
  }

  return { safe: true };
}

/**
 * Analyzes raw HTML markup, extracts sections, and suggests Handlebars variable mappings with confidence scores.
 */
export function analyzeHtmlMarkup(htmlContent: string, cssContent: string = ""): AnalysisResult {
  const warnings: string[] = [];

  // Basic title extraction
  const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "Custom Imported Template";

  const detectedSections: DetectedSection[] = [];
  const suggestedMappings: SuggestedMapping[] = [];

  // Helper to test regex on HTML
  const checkSection = (
    id: string,
    name: string,
    description: string,
    regex: RegExp,
    fallbackTag: string
  ) => {
    const match = htmlContent.match(regex);
    if (match) {
      detectedSections.push({
        id,
        name,
        description,
        detected: true,
        elementTag: fallbackTag,
        snippet: match[0].slice(0, 300) + (match[0].length > 300 ? "..." : ""),
      });
      return match[0];
    } else {
      detectedSections.push({
        id,
        name,
        description,
        detected: false,
        elementTag: fallbackTag,
        snippet: "",
      });
      return null;
    }
  };

  // 1. Detect Sections
  checkSection(
    "header",
    "Header & Navigation",
    "Site header, brand logo, top emergency bar, and navigation menu",
    /<header[\s\S]*?<\/header>|<nav[\s\S]*?<\/nav>/i,
    "header"
  );

  checkSection(
    "hero",
    "Hero Banner",
    "Main viewport headline, primary value proposition, and call-to-action button",
    /<section[^>]*(?:hero|banner|intro)[\s\S]*?<\/section>|<div[^>]*(?:hero|banner|intro)[\s\S]*?<\/div>/i,
    "section"
  );

  checkSection(
    "services",
    "Services Grid",
    "Catalog of trade services, repair offerings, and solutions",
    /<section[^>]*(?:service|services|offerings)[\s\S]*?<\/section>/i,
    "section"
  );

  checkSection(
    "areas",
    "Service Areas / Coverage",
    "City coverage list, neighborhood dispatch information, and arrival guarantees",
    /<section[^>]*(?:area|areas|locations|coverage)[\s\S]*?<\/section>/i,
    "section"
  );

  checkSection(
    "testimonials",
    "Reviews & Testimonials",
    "Client review quotes, 5-star badges, and verified customer feedback",
    /<section[^>]*(?:testimonial|testimonials|reviews)[\s\S]*?<\/section>/i,
    "section"
  );

  checkSection(
    "faqs",
    "FAQs & Q&A",
    "Frequently asked questions accordion or list",
    /<section[^>]*(?:faq|faqs|questions)[\s\S]*?<\/section>/i,
    "section"
  );

  checkSection(
    "contact",
    "Contact & Dispatch Form",
    "Office address, telephone numbers, business hours, and dispatch quote form",
    /<section[^>]*(?:contact|dispatch|reach)[\s\S]*?<\/section>|<form[\s\S]*?<\/form>/i,
    "section"
  );

  checkSection(
    "footer",
    "Footer & Copyright",
    "Bottom links, legal notice, and copyright declaration",
    /<footer[\s\S]*?<\/footer>/i,
    "footer"
  );

  // 2. Detect Values & Suggest Mappings

  // A. Phone number detection
  const phoneRegex = /\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phones = [...htmlContent.matchAll(phoneRegex)];
  if (phones.length > 0) {
    const rawPhone = phones[0][0];
    suggestedMappings.push({
      id: "mapping-phone",
      section: "Contact / Header",
      detectedText: rawPhone,
      suggestedVariable: "{{project.phone}}",
      confidence: 99,
      accepted: true,
      notes: "Primary customer telephone number for emergency calls.",
    });
  }

  // B. City, State Detection (e.g. "Denver, CO" or "Dallas, Texas")
  const cityStateRegex = /\b([A-Z][a-zA-Z\s]{2,15}),\s*([A-Z]{2})\b/g;
  const cityStates = [...htmlContent.matchAll(cityStateRegex)];
  if (cityStates.length > 0) {
    const rawLocation = cityStates[0][0];
    suggestedMappings.push({
      id: "mapping-location",
      section: "Hero / Footer",
      detectedText: rawLocation,
      suggestedVariable: "{{project.city}}, {{project.state}}",
      confidence: 94,
      accepted: true,
      notes: "Geographic market location coordinates.",
    });
  }

  // C. Brand / Business Name Detection from Title or Logo
  if (title && title.includes("|")) {
    const brandCandidate = title.split("|")[0].trim();
    if (brandCandidate.length > 3 && brandCandidate.length < 50) {
      suggestedMappings.push({
        id: "mapping-brand-title",
        section: "Header / Meta",
        detectedText: brandCandidate,
        suggestedVariable: "{{project.business_name}}",
        confidence: 95,
        accepted: true,
        notes: "Extracted from <title> tag.",
      });
    }
  }

  // D. Hero Headline detection
  const h1Match = htmlContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const rawH1 = h1Match[1].replace(/<[^>]+>/g, "").trim();
    if (rawH1.length > 5) {
      suggestedMappings.push({
        id: "mapping-hero-headline",
        section: "Hero",
        detectedText: rawH1,
        suggestedVariable: "{{content.hero.headline}}",
        confidence: 92,
        accepted: true,
        notes: "Top-level page H1 headline.",
      });
    }
  }

  // E. Current Year / Copyright detection
  const yearMatch = htmlContent.match(/\b(20[1-2][0-9])\b/);
  if (yearMatch) {
    suggestedMappings.push({
      id: "mapping-year",
      section: "Footer",
      detectedText: yearMatch[0],
      suggestedVariable: "{{currentYear}}",
      confidence: 98,
      accepted: true,
      notes: "Dynamic copyright year helper.",
    });
  }

  // F. Check for CSS
  if (!cssContent) {
    const inlineCssMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (inlineCssMatch) {
      cssContent = inlineCssMatch[1].trim();
    } else {
      warnings.push("No separate or inline CSS stylesheet detected. Template might require base styles.");
    }
  }

  return {
    title,
    rawHtml: htmlContent,
    css: cssContent,
    detectedSections,
    suggestedMappings,
    warnings,
  };
}

/**
 * Transforms uploaded HTML markup into the 7 standard Handlebars files using approved mappings.
 */
export function buildTemplateBundle(
  rawHtml: string,
  rawCss: string,
  approvedMappings: SuggestedMapping[],
  themeColor: string = "#1e3a8a"
): {
  layoutHbs: string;
  homepageHbs: string;
  servicePageHbs: string;
  serviceAreaPageHbs: string;
  blogPageHbs: string;
  contactPageHbs: string;
  styleCss: string;
} {
  let mappedHtml = rawHtml;

  // Apply approved text replacements
  for (const mapping of approvedMappings) {
    if (mapping.accepted && mapping.detectedText) {
      mappedHtml = mappedHtml.replaceAll(mapping.detectedText, mapping.suggestedVariable);
    }
  }

  const bodyMatch = mappedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : mappedHtml;

  // Separate header, main, and footer
  const headerMatch = bodyContent.match(/<header[\s\S]*?<\/header>/i);
  const headerHtml = headerMatch ? headerMatch[0] : "";

  const footerMatch = bodyContent.match(/<footer[\s\S]*?<\/footer>/i);
  const footerHtml = footerMatch ? footerMatch[0] : "";

  // Remove header and footer from the body to form homepage content
  let mainContent = bodyContent;
  if (headerHtml) mainContent = mainContent.replace(headerHtml, "");
  if (footerHtml) mainContent = mainContent.replace(footerHtml, "");

  // 1. layout.hbs
  const layoutHbs = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{#if meta.title}}{{meta.title}}{{else}}{{project.business_name}} | 24/7 Professional Services{{/if}}</title>
  <meta name="description" content="{{#if meta.description}}{{meta.description}}{{else}}Trusted local services in {{project.city}}, {{project.state}}. Call {{project.phone}} now.{{/if}}">
  <link rel="stylesheet" href="/style.css">
  {{{schemaJson}}}
</head>
<body>
  <!-- Header & Navigation -->
  ${headerHtml || `
  <header class="site-header">
    <div class="header-container">
      <div class="brand">
        <a href="/" class="brand-link"><strong>{{project.business_name}}</strong></a>
        <span class="location-badge">{{project.city}}, {{project.state}}</span>
      </div>
      <nav class="nav-menu">
        <a href="/">Home</a>
        <div class="dropdown">
          <span>Services ▾</span>
          <div class="dropdown-content">
            {{#each servicesList}}
            <a href="/{{this.slug}}">{{this.name}}</a>
            {{/each}}
          </div>
        </div>
        <div class="dropdown">
          <span>Areas ▾</span>
          <div class="dropdown-content">
            {{#each areasList}}
            <a href="/{{this.slug}}">{{this.name}}</a>
            {{/each}}
          </div>
        </div>
        <a href="/contact">Contact</a>
      </nav>
      <div class="header-cta">
        <a href="{{phoneLink project.phone}}" class="cta-button">Call: {{project.phone}}</a>
      </div>
    </div>
  </header>
  `}

  <!-- Dynamic Page Body -->
  {{{body}}}

  <!-- Footer -->
  ${footerHtml || `
  <footer class="site-footer">
    <div class="footer-container">
      <div class="footer-col">
        <h3>{{project.business_name}}</h3>
        <p>{{project.description}}</p>
        <p class="phone-highlight"><a href="{{phoneLink project.phone}}">{{project.phone}}</a></p>
        <p>{{project.address}}, {{project.city}}, {{project.state}} {{project.zip}}</p>
      </div>
      <div class="footer-col">
        <h4>Our Services</h4>
        <ul>
          {{#each servicesList}}
          <li><a href="/{{this.slug}}">{{this.name}}</a></li>
          {{/each}}
        </ul>
      </div>
      <div class="footer-col">
        <h4>Areas Served</h4>
        <ul>
          {{#each areasList}}
          <li><a href="/{{this.slug}}">{{this.name}}</a></li>
          {{/each}}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; {{currentYear}} {{project.business_name}}. All Rights Reserved. Local SEO Certified.</p>
    </div>
  </footer>
  `}
</body>
</html>`;

  // 2. homepage.hbs
  const homepageHbs = mainContent.trim() || `
<main class="page-main">
  <section class="hero-section">
    <div class="hero-content">
      <h1>{{content.hero.headline}}</h1>
      <p class="hero-subheadline">{{content.hero.subheadline}}</p>
      <div class="hero-actions">
        <a href="{{phoneLink project.phone}}" class="btn btn-primary">Call Now: {{project.phone}}</a>
        <a href="/contact" class="btn btn-outline">Request Fast Dispatch</a>
      </div>
    </div>
  </section>

  <section class="services-section">
    <h2>Our Professional Services in {{project.city}}</h2>
    <div class="services-grid">
      {{#each servicesList}}
      <div class="service-card">
        <h3>{{this.name}}</h3>
        <p>Reliable, licensed, and guaranteed service for {{this.name}} across {{../project.city}}.</p>
        <a href="/{{this.slug}}" class="card-link">View Service Details &rarr;</a>
      </div>
      {{/each}}
    </div>
  </section>

  <section class="areas-section">
    <h2>Areas & Neighborhoods We Serve</h2>
    <div class="areas-pills">
      {{#each areasList}}
      <a href="/{{this.slug}}" class="area-pill">{{this.name}}</a>
      {{/each}}
    </div>
  </section>
</main>
`;

  // 3. service-page.hbs
  const servicePageHbs = `
<main class="page-main service-detail-page">
  <section class="page-header">
    <div class="container">
      <span class="badge">Professional Service</span>
      <h1>{{page.title}} in {{project.city}}, {{project.state}}</h1>
      <p>{{content.hero.subheadline}}</p>
    </div>
  </section>

  <section class="service-body">
    <div class="container">
      <div class="service-process">
        <h2>Our Step-by-Step Process</h2>
        <div class="process-steps">
          {{#each content.process_steps}}
          <div class="step-card">
            <span class="step-number">{{@index}}</span>
            <h3>{{this.title}}</h3>
            <p>{{this.description}}</p>
          </div>
          {{/each}}
        </div>
      </div>

      <div class="cta-banner">
        <h3>Need Fast Emergency Service for {{page.title}}?</h3>
        <p>Our experienced technicians are standing by in {{project.city}}.</p>
        <a href="{{phoneLink project.phone}}" class="btn btn-primary">Call {{project.phone}} Now</a>
      </div>
    </div>
  </section>
</main>
`;

  // 4. service-area-page.hbs
  const serviceAreaPageHbs = `
<main class="page-main area-detail-page">
  <section class="page-header">
    <div class="container">
      <span class="badge">Local Dispatch</span>
      <h1>{{project.niche}} in {{page.title}}</h1>
      <p>Fast arrival guarantee and dedicated technicians stationed in {{page.title}}.</p>
    </div>
  </section>

  <section class="area-body">
    <div class="container">
      <div class="area-highlights">
        <h2>Local Service Guarantee in {{page.title}}</h2>
        <p>{{content.local_context}}</p>
      </div>

      <div class="services-list-container">
        <h3>Services Available in {{page.title}}</h3>
        <ul>
          {{#each servicesList}}
          <li><a href="/{{this.slug}}">{{this.name}}</a></li>
          {{/each}}
        </ul>
      </div>
    </div>
  </section>
</main>
`;

  // 5. blog-page.hbs
  const blogPageHbs = `
<main class="page-main blog-page">
  <article class="blog-article container">
    <header class="blog-header">
      <span class="badge">Local Home Guide</span>
      <h1>{{page.title}}</h1>
      <p class="blog-meta">Published by {{project.business_name}} &bull; Local SEO Guide</p>
    </header>

    <div class="blog-content">
      {{#each content.sections}}
      <section class="article-section">
        <h2>{{this.heading}}</h2>
        <p>{{this.content}}</p>
      </section>
      {{/each}}
    </div>
  </article>
</main>
`;

  // 6. contact-page.hbs
  const contactPageHbs = `
<main class="page-main contact-page">
  <section class="page-header">
    <div class="container">
      <h1>Contact {{project.business_name}}</h1>
      <p>Available 24/7 for emergency dispatch in {{project.city}}, {{project.state}}.</p>
    </div>
  </section>

  <section class="contact-section container">
    <div class="contact-grid">
      <div class="contact-info-card">
        <h3>Direct Contact</h3>
        <p><strong>Phone:</strong> <a href="{{phoneLink project.phone}}">{{project.phone}}</a></p>
        <p><strong>Address:</strong> {{project.address}}, {{project.city}}, {{project.state}} {{project.zip}}</p>
        <p><strong>Hours:</strong> 24 Hours / 7 Days a Week</p>
      </div>

      <div class="contact-form-card">
        <h3>Send Dispatch Request</h3>
        <form class="simple-form" onsubmit="event.preventDefault(); alert('Your request has been dispatched!');">
          <label>Your Name: <input type="text" required class="input-field" placeholder="John Doe"></label>
          <label>Phone Number: <input type="tel" required class="input-field" placeholder="(555) 000-0000"></label>
          <label>Service Needed: <input type="text" required class="input-field" placeholder="Emergency Repair"></label>
          <button type="submit" class="btn btn-primary">Dispatch Request Now</button>
        </form>
      </div>
    </div>
  </section>
</main>
`;

  // 7. style.css (combines raw CSS with responsive solid utility rules)
  const styleCss = `
/* ----------------------------------------------------
   SiteForge Solid Responsive Stylesheet
   Theme Color: ${themeColor}
---------------------------------------------------- */
:root {
  --primary: ${themeColor};
  --primary-dark: #0f172a;
  --bg-light: #ffffff;
  --bg-muted: #f8fafc;
  --border-color: #e2e8f0;
  --text-main: #0f172a;
  --text-muted: #64748b;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--text-main);
  background-color: var(--bg-light);
  line-height: 1.6;
}

a {
  color: var(--primary);
  text-decoration: none;
}

.container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.site-header {
  border-bottom: 1px solid var(--border-color);
  background: #ffffff;
  padding: 1rem 0;
}

.header-container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand-link {
  font-size: 1.25rem;
  color: var(--text-main);
}

.location-badge {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.cta-button, .btn-primary {
  background-color: var(--primary);
  color: #ffffff !important;
  padding: 0.5rem 1.25rem;
  border-radius: 4px;
  font-weight: 600;
  display: inline-block;
}

.page-main {
  min-height: 60vh;
}

.hero-section {
  background: var(--bg-muted);
  border-bottom: 1px solid var(--border-color);
  padding: 4rem 1.5rem;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-content h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-subheadline {
  font-size: 1.125rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.service-card {
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  border-radius: 6px;
  background: #ffffff;
}

.areas-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1.5rem 0;
}

.area-pill {
  padding: 0.35rem 0.85rem;
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  font-size: 0.8125rem;
  background: #ffffff;
}

.site-footer {
  border-top: 1px solid var(--border-color);
  background: var(--bg-muted);
  padding: 3rem 0 1rem;
  margin-top: 4rem;
}

.footer-container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 2rem;
}

.footer-bottom {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

/* Original Uploaded Stylesheet: */
${rawCss}
`;

  return {
    layoutHbs,
    homepageHbs,
    servicePageHbs,
    serviceAreaPageHbs,
    blogPageHbs,
    contactPageHbs,
    styleCss,
  };
}
