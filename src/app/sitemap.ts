import type { MetadataRoute } from "next";

const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ["", "/pricing", "/privacy", "/terms", "/support"].map(
    (pathname) => ({
      changeFrequency: pathname ? ("monthly" as const) : ("weekly" as const),
      lastModified,
      priority: pathname ? 0.6 : 1,
      url: `${appUrl}${pathname}`,
    }),
  );
}
