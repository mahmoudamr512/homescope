export const siteConfig = {
  name: "HomeScope",
  author: "Mahmoud Amr",
  jobTitle: "Software Engineer",
  url: "https://homescope.mahmoudamr.dev",
  description:
    "Interactive US housing-market explorer across state, metro, county, and ZIP. Built by Mahmoud Amr.",
  github: "https://github.com/mahmoudamr512",
  repo: "https://github.com/mahmoudamr512/homescope",
  // Author photo. Set NEXT_PUBLIC_AUTHOR_PHOTO to a path (e.g. /mahmoud-amr.jpg)
  // or a full URL; falls back to an initials avatar when unset.
  photo: process.env.NEXT_PUBLIC_AUTHOR_PHOTO ?? null,
  initials: "MA",
  portfolio: [
    { label: "mahmoudamr.dev", href: "https://mahmoudamr.dev" },
    { label: "fastnet.mahmoudamr.dev", href: "https://fastnet.mahmoudamr.dev" },
    { label: "obvote.com", href: "https://obvote.com" },
    { label: "GitHub", href: "https://github.com/mahmoudamr512" },
  ],
  keywords: [
    "Mahmoud Amr",
    "geospatial visualization",
    "MapLibre",
    "PMTiles",
    "PostGIS",
    "Next.js",
    "data engineering",
    "ETL",
    "housing market data",
    "choropleth map",
    "software engineer portfolio",
  ],
} as const;
