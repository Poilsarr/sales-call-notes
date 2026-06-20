/**
 * JSON-LD structured data for the landing page (Level 5.4 SEO).
 *
 * Inserted into the root <head> via a `<script type="application/ld+json">`
 * tag rendered in the root layout. Tells search engines "this is a SaaS
 * product called CallNote Pro, here's what it costs, here's what it does".
 *
 * Honest numbers: pricing reflects actual public tiers. No fake review
 * counts, no fabricated aggregateRating. If/when we collect real reviews,
 * add aggregateRating here.
 */

export function productJsonLd(): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CallNote Pro",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Sales Call Analytics",
    operatingSystem: "Web",
    description:
      "AI-powered sales call transcription, summarization, and competitive intelligence for SDRs.",
    url: "https://callnotepro.com",
    image: "https://callnotepro.com/og.png",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "9.00",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          billingIncrement: 1,
          unitCode: "MON",
        },
        availability: "https://schema.org/InStock",
      },
    ],
    featureList: [
      "Sales call transcription",
      "AI summaries and action items",
      "Competitive intelligence alerts",
      "HubSpot and Salesforce CRM sync",
      "Slack integration",
      "Google Calendar integration",
      "Chrome extension for Google Meet",
      "Public REST API with scoped API keys",
    ],
    author: {
      "@type": "Organization",
      name: "CallNote Pro",
      url: "https://callnotepro.com",
    },
  };
  return JSON.stringify(data);
}