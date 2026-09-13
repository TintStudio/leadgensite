import fs from "fs";
import path from "path";
import { hbsInstance } from "./handlebars";
import { generateLocalBusinessSchema, generateServiceSchema } from "./schema";
import { generateSitemapXml, generateRobotsTxt, SitemapUrlEntry } from "./seo";

export interface ProjectContext {
  id: string;
  business_name: string;
  domain: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  niche: string;
  description: string;
}

export interface RenderablePage {
  id: string;
  page_type: "homepage" | "service" | "service-area" | "blog" | "contact";
  title: string;
  slug: string;
  content_data: Record<string, unknown>;
  meta_title?: string;
  meta_description?: string;
}

export interface NavigationItem {
  name: string;
  slug: string;
}

export interface RenderWebsiteInput {
  templateId: "plumber-pro" | "water-damage-master" | string;
  project: ProjectContext;
  pages: RenderablePage[];
  servicesList: NavigationItem[];
  areasList: NavigationItem[];
}

export interface RenderedOutputPage {
  filePath: string; // e.g. "index.html", "services/leak-detection.html", "sitemap.xml"
  content: string;
}

export interface RenderWebsiteResult {
  outputPages: RenderedOutputPage[];
  cssFile: {
    fileName: string;
    content: string;
  };
}

/**
 * Resolves template directory path on the local filesystem.
 */
function getTemplateDir(templateId: string): string {
  const directPath = path.join(process.cwd(), "src", "templates", templateId);
  if (fs.existsSync(directPath)) {
    return directPath;
  }
  const normalizedId = templateId === "plumber-pro" ? "plumber-pro" : "water-damage";
  return path.join(process.cwd(), "src", "templates", normalizedId);
}

/**
 * Main Static Renderer Engine
 * Transforms structured JSON data for a website into 100% pure static HTML/CSS/SEO assets.
 */
export function renderWebsite(input: RenderWebsiteInput): RenderWebsiteResult {
  const templateDir = getTemplateDir(input.templateId);
  const isPlumber = input.templateId === "plumber-pro";
  const isEmergency = !isPlumber;

  // Load layout template
  const layoutSource = fs.readFileSync(path.join(templateDir, "layout.hbs"), "utf8");
  const layoutTemplate = hbsInstance.compile(layoutSource);

  // Load page templates
  const homepageSource = fs.readFileSync(path.join(templateDir, "homepage.hbs"), "utf8");
  const homepageTemplate = hbsInstance.compile(homepageSource);

  const serviceSource = fs.readFileSync(path.join(templateDir, "service-page.hbs"), "utf8");
  const serviceTemplate = hbsInstance.compile(serviceSource);

  const areaSource = fs.readFileSync(path.join(templateDir, "service-area-page.hbs"), "utf8");
  const areaTemplate = hbsInstance.compile(areaSource);

  const blogSource = fs.readFileSync(path.join(templateDir, "blog-page.hbs"), "utf8");
  const blogTemplate = hbsInstance.compile(blogSource);

  const contactSource = fs.readFileSync(path.join(templateDir, "contact-page.hbs"), "utf8");
  const contactTemplate = hbsInstance.compile(contactSource);

  // Load CSS
  const cssContent = fs.readFileSync(path.join(templateDir, "style.css"), "utf8");

  const outputPages: RenderedOutputPage[] = [];
  const sitemapEntries: SitemapUrlEntry[] = [];

  // Compile each page
  for (const page of input.pages) {
    let bodyHtml = "";

    // Generate page-type specific schema:
    // Dedicated Service schema for service pages, LocalBusiness schema for local pages
    let pageSchemaObj: Record<string, unknown>;
    if (page.page_type === "service") {
      const serviceDescription =
        (page.content_data?.description as string) ||
        (page.content_data?.service_overview as string) ||
        (page.content_data?.main_content as string) ||
        page.meta_description ||
        `${page.title} by ${input.project.business_name}`;

      pageSchemaObj = generateServiceSchema({
        service_name: page.title,
        service_description: serviceDescription,
        service_url: page.slug,
        business_name: input.project.business_name,
        website_url: input.project.domain,
        phone: input.project.phone,
        city: input.project.city,
      });
    } else {
      pageSchemaObj = generateLocalBusinessSchema({
        business_name: input.project.business_name,
        domain: input.project.domain,
        phone: input.project.phone,
        email: input.project.email,
        address: input.project.address,
        city: input.project.city,
        state: input.project.state,
        zip: input.project.zip,
        country: input.project.country,
        description: input.project.description,
        isPlumber,
        isEmergencyRestoration: isEmergency,
      });
    }

    const pageSchemaJson = JSON.stringify(pageSchemaObj, null, 2);

    switch (page.page_type) {
      case "homepage":
        bodyHtml = homepageTemplate({
          content: page.content_data,
          project: input.project,
          servicesList: input.servicesList,
          areasList: input.areasList,
        });
        break;

      case "service":
        bodyHtml = serviceTemplate({
          content: page.content_data,
          project: input.project,
          servicesList: input.servicesList,
          areasList: input.areasList,
        });
        break;

      case "service-area":
        bodyHtml = areaTemplate({
          content: page.content_data,
          project: input.project,
          servicesList: input.servicesList,
          areasList: input.areasList,
        });
        break;

      case "blog":
        bodyHtml = blogTemplate({
          content: page.content_data,
          project: input.project,
        });
        break;

      case "contact":
        bodyHtml = contactTemplate({
          content: page.content_data,
          project: input.project,
        });
        break;
    }

    // Wrap in Master Layout
    const fullHtml = layoutTemplate({
      meta_title: page.meta_title || page.title,
      meta_description: page.meta_description || "",
      slug: page.slug,
      schemaJson: pageSchemaJson,
      project: input.project,
      servicesList: input.servicesList,
      areasList: input.areasList,
      body: bodyHtml,
    });

    // Determine output file path
    let outputFilePath = "";
    if (page.page_type === "homepage" || page.slug === "") {
      outputFilePath = "index.html";
    } else {
      outputFilePath = `${page.slug.replace(/\.html$/, "")}.html`;
    }

    outputPages.push({
      filePath: outputFilePath,
      content: fullHtml,
    });

    sitemapEntries.push({
      slug: page.slug,
    });
  }

  // Generate Sitemap and Robots
  const sitemapXml = generateSitemapXml(input.project.domain, sitemapEntries);
  outputPages.push({
    filePath: "sitemap.xml",
    content: sitemapXml,
  });

  const robotsTxt = generateRobotsTxt(input.project.domain);
  outputPages.push({
    filePath: "robots.txt",
    content: robotsTxt,
  });

  return {
    outputPages,
    cssFile: {
      fileName: "style.css",
      content: cssContent,
    },
  };
}

export interface RenderSinglePageInput {
  templateId: "plumber-pro" | "water-damage-master" | string;
  project: ProjectContext;
  page: RenderablePage;
  servicesList?: NavigationItem[];
  areasList?: NavigationItem[];
}

/**
 * Compiles a single page into static HTML wrapped in the template layout.
 * Useful for instant editor preview and re-compiling individual edited pages.
 */
export function renderSinglePage(input: RenderSinglePageInput): {
  filePath: string;
  html: string;
} {
  const templateDir = getTemplateDir(input.templateId);

  const isPlumber =
    input.templateId === "plumber-pro" ||
    input.project.niche.toLowerCase().includes("plumb");
  const isEmergency =
    input.templateId === "water-damage-master" ||
    input.project.niche.toLowerCase().includes("water");

  // Load layout
  const layoutSource = fs.readFileSync(path.join(templateDir, "layout.hbs"), "utf8");
  const layoutTemplate = hbsInstance.compile(layoutSource);

  let pageSourceFile = "homepage.hbs";
  switch (input.page.page_type) {
    case "homepage":
      pageSourceFile = "homepage.hbs";
      break;
    case "service":
      pageSourceFile = "service-page.hbs";
      break;
    case "service-area":
      pageSourceFile = "service-area-page.hbs";
      break;
    case "blog":
      pageSourceFile = "blog-page.hbs";
      break;
    case "contact":
      pageSourceFile = "contact-page.hbs";
      break;
  }

  const pageSource = fs.readFileSync(path.join(templateDir, pageSourceFile), "utf8");
  const pageTemplate = hbsInstance.compile(pageSource);

  let schemaObj: Record<string, unknown>;
  if (input.page.page_type === "service") {
    const serviceDescription =
      (input.page.content_data?.description as string) ||
      (input.page.content_data?.service_overview as string) ||
      (input.page.content_data?.main_content as string) ||
      input.page.meta_description ||
      `${input.page.title} by ${input.project.business_name}`;

    schemaObj = generateServiceSchema({
      service_name: input.page.title,
      service_description: serviceDescription,
      service_url: input.page.slug,
      business_name: input.project.business_name,
      website_url: input.project.domain,
      phone: input.project.phone,
      city: input.project.city,
    });
  } else {
    schemaObj = generateLocalBusinessSchema({
      business_name: input.project.business_name,
      domain: input.project.domain,
      phone: input.project.phone,
      email: input.project.email,
      address: input.project.address,
      city: input.project.city,
      state: input.project.state,
      zip: input.project.zip,
      country: input.project.country,
      description: input.project.description,
      isPlumber,
      isEmergencyRestoration: isEmergency,
    });
  }
  const schemaJson = JSON.stringify(schemaObj, null, 2);

  const bodyHtml = pageTemplate({
    content: input.page.content_data,
    project: input.project,
    servicesList: input.servicesList || [],
    areasList: input.areasList || [],
  });

  const fullHtml = layoutTemplate({
    meta_title: input.page.meta_title || input.page.title,
    meta_description: input.page.meta_description || "",
    slug: input.page.slug,
    schemaJson,
    project: input.project,
    servicesList: input.servicesList || [],
    areasList: input.areasList || [],
    body: bodyHtml,
  });

  let outputFilePath = "";
  if (input.page.page_type === "homepage" || input.page.slug === "") {
    outputFilePath = "index.html";
  } else {
    outputFilePath = `${input.page.slug.replace(/\.html$/, "")}.html`;
  }

  return {
    filePath: outputFilePath,
    html: fullHtml,
  };
}

