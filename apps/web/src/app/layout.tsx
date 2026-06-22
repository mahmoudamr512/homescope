import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { StructuredData } from "@/components/structured-data";
import { siteConfig } from "@/lib/site";
import "@homescope/config/tokens.css";
import "./globals.css";

const titleDefault = `${siteConfig.name} — US Housing Market Explorer by ${siteConfig.author}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: titleDefault, template: `%s | ${siteConfig.name} by ${siteConfig.author}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  category: "technology",
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author, url: "https://mahmoudamr.dev" }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  alternates: { canonical: siteConfig.url },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    title: titleDefault,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: titleDefault,
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <StructuredData />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
