import { siteConfig } from "@/lib/site";

// JSON-LD: a Person (Mahmoud Amr) and the SoftwareApplication, for search engines.
export function StructuredData() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author,
    jobTitle: siteConfig.jobTitle,
    url: "https://mahmoudamr.dev",
    image: `${siteConfig.url}${siteConfig.photo}`,
    email: `mailto:${siteConfig.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Cairo", addressCountry: "EG" },
    sameAs: [
      siteConfig.github,
      siteConfig.linkedin,
      siteConfig.upwork,
      "https://fastnet.mahmoudamr.dev",
      "https://obvote.com",
    ],
  };

  const app = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "DataVisualizationApplication",
    operatingSystem: "Web",
    description: siteConfig.description,
    url: siteConfig.url,
    image: `${siteConfig.url}/opengraph-image`,
    author: { "@type": "Person", name: siteConfig.author, url: "https://mahmoudamr.dev" },
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
