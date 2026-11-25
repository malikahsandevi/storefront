import type { Metadata } from "next";
import CatalogBrowser, { type CatalogFilters } from "@/components/CatalogBrowser";
import { SITE_URL, fetchCategories, fetchProducts, fetchStoreConfig, storeDisplayName } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  return {
    title: "Shop",
    description: `Browse the full ${name} catalog — search, filter by category and price, and order online with tracked delivery.`,
    alternates: { canonical: `${SITE_URL}/shop` },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const filters: CatalogFilters = {
    category: one(params.category),
    q: one(params.q),
    min: one(params.min),
    max: one(params.max),
    sort: one(params.sort) || "newest",
    page: Math.max(1, parseInt(one(params.page) || "1", 10) || 1),
  };
  const [config, categories, result] = await Promise.all([
    fetchStoreConfig(),
    fetchCategories(),
    fetchProducts({
      category: filters.category,
      search: filters.q,
      minPrice: filters.min,
      maxPrice: filters.max,
      sort: filters.sort,
      page: filters.page,
      limit: 24,
    }),
  ]);

  return (
    <div className="py-10">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <span aria-hidden className="mono-label text-primary">01</span>
          <span className="mono-label text-muted-2">Catalog</span>
          <span aria-hidden className="kicker-bar" />
        </div>
        <h1 className="mt-3 font-display text-5xl font-black uppercase tracking-tight text-cream sm:text-6xl">Shop</h1>
      </div>
      <CatalogBrowser
        basePath="/shop"
        categories={categories}
        products={result.products}
        total={result.total}
        page={result.page}
        pages={result.pages}
        filters={filters}
        currency={config.currency}
      />
    </div>
  );
}
