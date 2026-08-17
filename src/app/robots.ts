import type { MetadataRoute } from "next";

const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: ["/", "/pricing", "/privacy", "/terms", "/support"],
      disallow: ["/api/", "/settings", "/reset-password", "/check-email"],
      userAgent: "*",
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
