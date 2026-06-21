import { siteConfig } from "@/lib/site";

// JSON-LD: a Person (Mahmoud Amr) and the SoftwareApplication, for search engines.
export function StructuredData() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author,
    jobTitle: siteConfig.jobTitle,
    url: siteConfig.url,
    sameAs: siteConfig.portfolio.map((p) => p.href),
  };

  const app = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "DataVisualizationApplication",
    operatingSystem: "Web",
    description: siteConfig.description,
    url: siteConfig.url,
    author: { "@type": "Person", name: siteConfig.author, url: siteConfig.url },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(app) }}
      />
    </>
  );
}
