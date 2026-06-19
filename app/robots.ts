import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/login", "/perfil"],
      },
    ],
    sitemap: "https://pinogalant.com.ar/sitemap.xml",
  };
}
