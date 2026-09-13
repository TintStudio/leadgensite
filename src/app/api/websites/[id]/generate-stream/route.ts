import { createClient } from "@/lib/supabase/server";
import { getUserAICredentials } from "@/lib/ai/user-credentials";
import { generateStructuredContent } from "@/lib/ai/generate";
import {
  DEFAULT_SYSTEM_PROMPT,
  HOMEPAGE_PROMPT_TEMPLATE,
  SERVICE_PAGE_PROMPT_TEMPLATE,
  SERVICE_AREA_PAGE_PROMPT_TEMPLATE,
  BLOG_POST_PROMPT_TEMPLATE,
  interpolatePrompt,
} from "@/lib/ai/prompts";
import {
  HomepageContentSchema,
  SeoSectionSchema,
  HeroSectionSchema,
  AboutSectionSchema,
  WhyChooseUsSectionSchema,
  ServicesOverviewSectionSchema,
  FaqsSectionSchema,
  CtaBannerSectionSchema,
  ServicePageContentSchema,
  ServiceAreaPageContentSchema,
  BlogPostContentSchema,
  ContactPageContentSchema,
} from "@/lib/ai/schemas";
import { getPromptTemplateById } from "@/lib/config/prompts-store";
import { renderWebsite } from "@/lib/renderer/engine";
import { uploadFileToStorage } from "@/lib/storage/r2";

export const maxDuration = 300;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: websiteId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const supabase = await createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          sendEvent({ phase: "error", message: "Unauthorized. Please log in." });
          controller.close();
          return;
        }

        // 1. Fetch credentials
        sendEvent({
          phase: "init",
          message: "Researching keywords for new pages",
          current: 0,
          total: 1,
          percent: 5,
        });

        const { credentials, error: credError } = await getUserAICredentials();
        if (credError || !credentials) {
          sendEvent({
            phase: "error",
            message: credError || "No AI API key found. Please configure it in Settings.",
          });
          controller.close();
          return;
        }

        // 2. Fetch Website with Project
        const { data: website, error: websiteError } = await supabase
          .from("websites")
          .select(
            `
            id,
            status,
            brand_settings,
            project_id,
            projects (
              id,
              business_name,
              domain,
              phone,
              email,
              address,
              city,
              state,
              zip,
              niche,
              description,
              additional_info
            )
          `
          )
          .eq("id", websiteId)
          .eq("user_id", user.id)
          .single<{
            id: string;
            status: string;
            brand_settings: Record<string, unknown> | null;
            project_id: string;
            projects: {
              id: string;
              business_name: string;
              domain: string;
              phone: string;
              email: string | null;
              address: string;
              city: string;
              state: string;
              zip: string;
              niche: string;
              description: string;
              additional_info: string | null;
            } | null;
          }>();

        if (websiteError || !website || !website.projects) {
          sendEvent({ phase: "error", message: "Website or associated project not found" });
          controller.close();
          return;
        }

        const project = website.projects;
        const brandSettings = website.brand_settings || {};

        // Mark website as generating
        await supabase
          .from("websites")
          .update({ status: "generating" } as never)
          .eq("id", websiteId);

        // Fetch Services and Service Areas
        interface ServiceRow {
          id: string;
          name: string;
          slug: string;
          secondary_keywords: string[];
        }
        interface ServiceAreaRow {
          id: string;
          area_name: string;
          city: string;
          state: string;
          slug: string;
        }

        const { data: services } = await supabase
          .from("services")
          .select("id, name, slug, secondary_keywords")
          .eq("project_id", project.id)
          .order("sort_order", { ascending: true })
          .returns<ServiceRow[]>();

        const { data: areas } = await supabase
          .from("service_areas")
          .select("id, area_name, city, state, slug")
          .eq("project_id", project.id)
          .order("sort_order", { ascending: true })
          .returns<ServiceAreaRow[]>();

        const blogTitles: string[] = (brandSettings.blog_titles as string[]) || [];
        const targetKeyword =
          (brandSettings.target_keyword as string) || `${project.niche} in ${project.city}`;
        const secondaryKeywords = (brandSettings.secondary_keywords as string[]) || [];

        const servicesList = (services || []).map((s) => s.name);
        const serviceAreasList = (areas || []).map((a) => a.area_name);

        const totalPages =
          1 + // Homepage
          (services?.length || 0) +
          (areas?.length || 0) +
          blogTitles.length +
          1; // Contact page

        let pagesGeneratedSoFar = 0;

        const baseContext = {
          business_name: project.business_name,
          domain: project.domain,
          phone: project.phone,
          email: project.email || undefined,
          address: project.address,
          city: project.city,
          state: project.state,
          zip: project.zip,
          niche: project.niche,
          description: project.description,
          years_in_business: (brandSettings.years_in_business as string) || undefined,
          background_info: project.additional_info || undefined,
          target_keyword: targetKeyword,
          secondary_keywords: secondaryKeywords,
          services_list: servicesList,
          service_areas_list: serviceAreasList,
        };

        const generatedPages: Array<{ page_type: string; title: string; slug: string }> = [];

        // --- STEP A: Generate Homepage ---
        sendEvent({
          phase: "homepage",
          message: "Generating Homepage modular sections...",
          current: pagesGeneratedSoFar,
          total: totalPages,
          percent: Math.max(5, Math.round((pagesGeneratedSoFar / totalPages) * 100)),
        });

        const systemRule = getPromptTemplateById("system") || DEFAULT_SYSTEM_PROMPT;
        const seoPromptTemplate = getPromptTemplateById("homepage_seo");
        const heroPromptTemplate = getPromptTemplateById("homepage_hero");
        const aboutPromptTemplate = getPromptTemplateById("homepage_about");
        const whyUsPromptTemplate = getPromptTemplateById("homepage_why_us");
        const servicesPromptTemplate = getPromptTemplateById("homepage_services");
        const faqsPromptTemplate = getPromptTemplateById("homepage_faqs");
        const ctaPromptTemplate = getPromptTemplateById("homepage_cta");

        let homepageContent;

        if (
          seoPromptTemplate &&
          heroPromptTemplate &&
          aboutPromptTemplate &&
          whyUsPromptTemplate &&
          servicesPromptTemplate &&
          faqsPromptTemplate &&
          ctaPromptTemplate
        ) {
          const [
            seoData,
            heroData,
            aboutData,
            whyUsData,
            servicesData,
            faqsData,
            ctaData,
          ] = await Promise.all([
            generateStructuredContent(
              credentials,
              systemRule,
              interpolatePrompt(seoPromptTemplate, baseContext),
              SeoSectionSchema
            ),
            generateStructuredContent(
              credentials,
              systemRule,
              interpolatePrompt(heroPromptTemplate, baseContext),
              HeroSectionSchema
            ),
            generateStructuredContent(
              credentials,
              systemRule,
              interpolatePrompt(aboutPromptTemplate, baseContext),
              AboutSectionSchema
            ),
            generateStructuredContent(
              credentials,
              systemRule,
              interpolatePrompt(whyUsPromptTemplate, baseContext),
              WhyChooseUsSectionSchema
            ),
            generateStructuredContent(
              credentials,
              systemRule,
              interpolatePrompt(servicesPromptTemplate, baseContext),
              ServicesOverviewSectionSchema
            ),
            generateStructuredContent(
              credentials,
              systemRule,
              interpolatePrompt(faqsPromptTemplate, baseContext),
              FaqsSectionSchema
            ),
            generateStructuredContent(
              credentials,
              systemRule,
              interpolatePrompt(ctaPromptTemplate, baseContext),
              CtaBannerSectionSchema
            ),
          ]);

          homepageContent = {
            meta_title: seoData.meta_title,
            meta_description: seoData.meta_description,
            hero: heroData,
            about: aboutData,
            services_overview: servicesData,
            why_choose_us: whyUsData,
            faqs: faqsData.faqs,
            cta_banner: ctaData,
          };
        } else {
          const fallbackPrompt =
            getPromptTemplateById("homepage_full") || HOMEPAGE_PROMPT_TEMPLATE;
          const homepagePrompt = interpolatePrompt(fallbackPrompt, baseContext);
          homepageContent = await generateStructuredContent(
            credentials,
            systemRule,
            homepagePrompt,
            HomepageContentSchema
          );
        }

        await supabase.from("pages").upsert(
          {
            website_id: website.id,
            user_id: user.id,
            page_type: "homepage",
            title: "Home",
            slug: "",
            content_data: homepageContent as never,
            meta_title: homepageContent.meta_title,
            meta_description: homepageContent.meta_description,
            status: "generated",
            sort_order: 0,
          } as never,
          { onConflict: "website_id,slug" }
        );
        generatedPages.push({ page_type: "homepage", title: "Home", slug: "" });
        pagesGeneratedSoFar++;

        sendEvent({
          phase: "homepage",
          message: "Homepage generated successfully",
          current: pagesGeneratedSoFar,
          total: totalPages,
          percent: Math.round((pagesGeneratedSoFar / totalPages) * 100),
        });

        // --- STEP B: Generate Service Pages ---
        if (services && services.length > 0) {
          for (let i = 0; i < services.length; i++) {
            const service = services[i];
            sendEvent({
              phase: "services",
              message: `Generating Service: ${service.name}`,
              current: pagesGeneratedSoFar,
              total: totalPages,
              percent: Math.round((pagesGeneratedSoFar / totalPages) * 100),
            });

            const servicePrompt = interpolatePrompt(SERVICE_PAGE_PROMPT_TEMPLATE, {
              ...baseContext,
              service_name: service.name,
              service_keywords: service.secondary_keywords,
            });

            const serviceContent = await generateStructuredContent(
              credentials,
              DEFAULT_SYSTEM_PROMPT,
              servicePrompt,
              ServicePageContentSchema
            );

            await supabase.from("pages").upsert(
              {
                website_id: website.id,
                user_id: user.id,
                page_type: "service",
                title: service.name,
                slug: `services/${service.slug}`,
                content_data: serviceContent as never,
                meta_title: serviceContent.meta_title,
                meta_description: serviceContent.meta_description,
                status: "generated",
                reference_id: service.id,
                reference_type: "service",
                sort_order: i + 1,
              } as never,
              { onConflict: "website_id,slug" }
            );
            generatedPages.push({
              page_type: "service",
              title: service.name,
              slug: `services/${service.slug}`,
            });
            pagesGeneratedSoFar++;

            sendEvent({
              phase: "services",
              message: `Created service: ${service.name}`,
              current: pagesGeneratedSoFar,
              total: totalPages,
              percent: Math.round((pagesGeneratedSoFar / totalPages) * 100),
            });
          }
        }

        // --- STEP C: Generate Service Area Pages ---
        if (areas && areas.length > 0) {
          for (let i = 0; i < areas.length; i++) {
            const area = areas[i];
            sendEvent({
              phase: "areas",
              message: `Generating Area: ${area.area_name}`,
              current: pagesGeneratedSoFar,
              total: totalPages,
              percent: Math.round((pagesGeneratedSoFar / totalPages) * 100),
            });

            const areaPrompt = interpolatePrompt(SERVICE_AREA_PAGE_PROMPT_TEMPLATE, {
              ...baseContext,
              area_name: area.area_name,
              city: area.city,
              state: area.state,
            });

            const areaContent = await generateStructuredContent(
              credentials,
              DEFAULT_SYSTEM_PROMPT,
              areaPrompt,
              ServiceAreaPageContentSchema
            );

            await supabase.from("pages").upsert(
              {
                website_id: website.id,
                user_id: user.id,
                page_type: "service-area",
                title: `${project.niche} in ${area.area_name}`,
                slug: `areas/${area.slug}`,
                content_data: areaContent as never,
                meta_title: areaContent.meta_title,
                meta_description: areaContent.meta_description,
                status: "generated",
                reference_id: area.id,
                reference_type: "service_area",
                sort_order: (services?.length || 0) + i + 1,
              } as never,
              { onConflict: "website_id,slug" }
            );
            generatedPages.push({
              page_type: "service-area",
              title: area.area_name,
              slug: `areas/${area.slug}`,
            });
            pagesGeneratedSoFar++;

            sendEvent({
              phase: "areas",
              message: `Created area: ${area.area_name}`,
              current: pagesGeneratedSoFar,
              total: totalPages,
              percent: Math.round((pagesGeneratedSoFar / totalPages) * 100),
            });
          }
        }

        // --- STEP D: Generate Blog Posts ---
        if (blogTitles && blogTitles.length > 0) {
          for (let i = 0; i < blogTitles.length; i++) {
            const blogTitle = blogTitles[i];
            sendEvent({
              phase: "blogs",
              message: `Writing Blog: ${blogTitle}`,
              current: pagesGeneratedSoFar,
              total: totalPages,
              percent: Math.round((pagesGeneratedSoFar / totalPages) * 100),
            });

            const blogPrompt = interpolatePrompt(BLOG_POST_PROMPT_TEMPLATE, {
              ...baseContext,
              blog_title: blogTitle,
            });

            const blogContent = await generateStructuredContent(
              credentials,
              DEFAULT_SYSTEM_PROMPT,
              blogPrompt,
              BlogPostContentSchema
            );

            await supabase.from("pages").upsert(
              {
                website_id: website.id,
                user_id: user.id,
                page_type: "blog" as never,
                title: blogContent.title || blogTitle,
                slug: `blog/${blogContent.slug}`,
                content_data: blogContent as never,
                meta_title: blogContent.meta_title,
                meta_description: blogContent.meta_description,
                status: "generated",
                sort_order: (services?.length || 0) + (areas?.length || 0) + i + 1,
              } as never,
              { onConflict: "website_id,slug" }
            );
            generatedPages.push({
              page_type: "blog",
              title: blogTitle,
              slug: `blog/${blogContent.slug}`,
            });
            pagesGeneratedSoFar++;

            sendEvent({
              phase: "blogs",
              message: `Created blog: ${blogTitle}`,
              current: pagesGeneratedSoFar,
              total: totalPages,
              percent: Math.round((pagesGeneratedSoFar / totalPages) * 100),
            });
          }
        }

        // --- STEP E: Generate Contact Page ---
        sendEvent({
          phase: "contact",
          message: "Generating Contact & Emergency Dispatch Page...",
          current: pagesGeneratedSoFar,
          total: totalPages,
          percent: Math.round((pagesGeneratedSoFar / totalPages) * 100),
        });

        const contactContent = {
          meta_title: `Contact Us | ${project.business_name} | ${project.city}, ${project.state}`,
          meta_description: `Contact ${project.business_name} for 24/7 fast emergency service in ${project.city}, ${project.state}. Call ${project.phone} now.`,
          hero: {
            headline: `Contact ${project.business_name}`,
            subheadline: `Fast response dispatch in ${project.city}, ${project.state} and surrounding areas.`,
          },
          contact_info: {
            phone: project.phone,
            email: project.email || `contact@${project.domain}`,
            address: `${project.address}, ${project.city}, ${project.state} ${project.zip}`,
            business_hours: "Available 24 Hours / 7 Days a Week",
          },
          emergency_note:
            "Immediate dispatch available for active emergencies. Call directly for prioritized support.",
        };

        const validatedContact = ContactPageContentSchema.parse(contactContent);

        await supabase.from("pages").upsert(
          {
            website_id: website.id,
            user_id: user.id,
            page_type: "contact",
            title: "Contact Us",
            slug: "contact",
            content_data: validatedContact as never,
            meta_title: validatedContact.meta_title,
            meta_description: validatedContact.meta_description,
            status: "generated",
            sort_order: 999,
          } as never,
          { onConflict: "website_id,slug" }
        );
        generatedPages.push({ page_type: "contact", title: "Contact Us", slug: "contact" });
        pagesGeneratedSoFar++;

        // --- STEP F: Static Handlebars Rendering & Cloudflare R2 Upload ---
        sendEvent({
          phase: "building",
          message: "Compiling HTML templates & syncing to Cloudflare R2...",
          current: totalPages,
          total: totalPages,
          percent: 95,
        });

        const { data: allPages } = await supabase
          .from("pages")
          .select("id, page_type, title, slug, content_data, meta_title, meta_description")
          .eq("website_id", website.id)
          .order("sort_order", { ascending: true })
          .returns<
            Array<{
              id: string;
              page_type: "homepage" | "service" | "service-area" | "blog" | "contact";
              title: string;
              slug: string;
              content_data: Record<string, unknown>;
              meta_title?: string;
              meta_description?: string;
            }>
          >();

        let storageLocation = "";
        let uploadedFilesCount = 0;

        if (allPages && allPages.length > 0) {
          const templateSlug =
            (website.brand_settings?.template_id as string) || "plumber-pro";

          const renderResult = renderWebsite({
            templateId: templateSlug,
            project: {
              id: project.id,
              business_name: project.business_name,
              domain: project.domain,
              phone: project.phone,
              email: project.email || undefined,
              address: project.address,
              city: project.city,
              state: project.state,
              zip: project.zip,
              country: "US",
              niche: project.niche,
              description: project.description,
            },
            pages: allPages,
            servicesList: (services || []).map((s) => ({ name: s.name, slug: s.slug })),
            areasList: (areas || []).map((a) => ({ name: a.area_name, slug: a.slug })),
          });

          for (const file of renderResult.outputPages) {
            const mimeType = file.filePath.endsWith(".xml")
              ? "application/xml"
              : file.filePath.endsWith(".txt")
              ? "text/plain"
              : "text/html; charset=utf-8";

            const uploadRes = await uploadFileToStorage(
              `websites/${website.id}/${file.filePath}`,
              file.content,
              mimeType
            );

            if (!storageLocation) {
              storageLocation = uploadRes.isR2 ? "Cloudflare R2" : "Local Storage";
            }
            uploadedFilesCount++;
          }

          await uploadFileToStorage(
            `websites/${website.id}/${renderResult.cssFile.fileName}`,
            renderResult.cssFile.content,
            "text/css; charset=utf-8"
          );
          uploadedFilesCount++;
        }

        // Mark website as generated
        await supabase
          .from("websites")
          .update({
            status: "generated",
            total_pages: generatedPages.length,
            storage_path: `websites/${website.id}`,
            generated_at: new Date().toISOString(),
          } as never)
          .eq("id", websiteId);

        // Final Complete Event
        sendEvent({
          phase: "complete",
          message: "Website generation completed successfully!",
          current: totalPages,
          total: totalPages,
          percent: 100,
          data: {
            totalPages: generatedPages.length,
            uploadedFiles: uploadedFilesCount,
            storage: storageLocation,
            pages: generatedPages,
          },
        });

        controller.close();
      } catch (err: unknown) {
        sendEvent({
          phase: "error",
          message: err instanceof Error ? err.message : "Failed to generate website content",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
