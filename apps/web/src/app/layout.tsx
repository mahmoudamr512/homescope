import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { StructuredData } from "@/components/structured-data";
import { siteConfig } from "@/lib/site";
import "@homescope/config/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — by ${siteConfig.author}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author, url: siteConfig.github }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  alternates: { canonical: siteConfig.url },
  openGraph: {
    type: "website",
    title: `${siteConfig.name} — by ${siteConfig.author}`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — by ${siteConfig.author}`,
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
