import { MetadataRoute } from "next";
import { getAllTokkoProperties } from "@/lib/tokko";

const BASE = "https://pinogalant.com.ar";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE}/propiedades`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE}/tasacion`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  let propPages: MetadataRoute.Sitemap = [];
  try {
    const props = await getAllTokkoProperties();
    propPages = props.map((p) => ({
      url: `${BASE}/propiedades/${p.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {}

  return [...staticPages, ...propPages];
}
