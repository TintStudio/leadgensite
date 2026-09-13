export interface LocalBusinessSchemaInput {
  business_name: string;
  domain: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  description: string;
  image?: string;
  primary_service?: string;
  isPlumber?: boolean;
  isEmergencyRestoration?: boolean;
}

export interface ServicePageSchemaInput {
  service_name: string;
  service_description: string;
  service_url: string;
  business_name: string;
  website_url: string;
  phone: string;
  city: string;
}

/**
 * Generates exact Schema.org LocalBusiness JSON-LD for local homepage, contact, and service area pages:
 * {
 *   "@context": "https://schema.org",
 *   "@type": "LocalBusiness",
 *   "name": "{{business_name}}",
 *   "url": "{{website_url}}",
 *   "telephone": "{{phone}}",
 *   "image": "{{business_image}}",
 *   "description": "{{business_description}}",
 *   "address": {
 *     "@type": "PostalAddress",
 *     "streetAddress": "{{street_address}}",
 *     "addressLocality": "{{city}}",
 *     "addressRegion": "{{state}}",
 *     "postalCode": "{{zip}}",
 *     "addressCountry": "{{country_code}}"
 *   },
 *   "areaServed": [
 *     {
 *       "@type": "City",
 *       "name": "{{city}}"
 *     }
 *   ],
 *   "serviceType": "{{primary_service}}"
 * }
 */
export function generateLocalBusinessSchema(input: LocalBusinessSchemaInput): Record<string, unknown> {
  const websiteUrl = input.domain.startsWith("http")
    ? input.domain
    : `https://${input.domain}`;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.business_name,
    url: websiteUrl,
    telephone: input.phone,
    image: input.image || `${websiteUrl}/images/hero.jpg`,
    description: input.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.address,
      addressLocality: input.city,
      addressRegion: input.state,
      postalCode: input.zip,
      addressCountry: input.country || "US",
    },
    areaServed: [
      {
        "@type": "City",
        name: input.city,
      },
    ],
    serviceType: input.primary_service || (input.isPlumber ? "Plumbing Services" : "Emergency Restoration Services"),
  };
}

/**
 * Generates exact Schema.org Service JSON-LD for dedicated service pages:
 * {
 *   "@context": "https://schema.org",
 *   "@type": "Service",
 *   "name": "{{service_name}}",
 *   "description": "{{service_description}}",
 *   "url": "{{service_url}}",
 *   "provider": {
 *     "@type": "LocalBusiness",
 *     "name": "{{business_name}}",
 *     "url": "{{website_url}}",
 *     "telephone": "{{phone}}"
 *   },
 *   "areaServed": {
 *     "@type": "City",
 *     "name": "{{city}}"
 *   },
 *   "serviceType": "{{service_name}}"
 * }
 */
export function generateServiceSchema(input: ServicePageSchemaInput): Record<string, unknown> {
  const websiteUrl = input.website_url.startsWith("http")
    ? input.website_url
    : `https://${input.website_url}`;

  const serviceUrl = input.service_url.startsWith("http")
    ? input.service_url
    : `${websiteUrl}/${input.service_url.replace(/^\//, "")}`;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.service_name,
    description: input.service_description,
    url: serviceUrl,
    provider: {
      "@type": "LocalBusiness",
      name: input.business_name,
      url: websiteUrl,
      telephone: input.phone,
    },
    areaServed: {
      "@type": "City",
      name: input.city,
    },
    serviceType: input.service_name,
  };
}
