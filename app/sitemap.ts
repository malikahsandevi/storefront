import type { MetadataRoute } from "next";
import { SITE_URL, fetchCategories, fetchProducts } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, catalog] = await Promise.all([
    fetchCategories(),
    fetchProducts({ limit: 100, sort: "newest" }),
  ]);
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
  for (const category of categories) {
    entries.push({
      url: `${SITE_URL}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  for (const product of catalog.products) {
    entries.push({
      url: `${SITE_URL}/product/${product.slug}`,
      lastModified: product.createdAt ? new Date(product.createdAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  return entries;
}
