import type { Metadata } from "next";
import CatalogBrowser, { type CatalogFilters } from "@/components/CatalogBrowser";
import Faq from "@/components/Faq";
import SectionHead from "@/components/SectionHead";
import { HelpBand, StepsSection, faqItems } from "@/components/Sections";
import { IconCheck } from "@/components/icons";
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

/**
 * The collection page in the reference composition: a compact
 * page head (numbered kicker, display title, trust ticks) above
 * the facet bar and card grid, then — like the reference
 * collections — the numbered chain, the help band and the FAQ
 * below the grid.
 */
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
  const stepImages = [
    categories.find((c) => c.image)?.image || null,
    categories.filter((c) => c.image)[1]?.image || null,
    categories.filter((c) => c.image)[2]?.image || null,
  ];

  return (
    <>
      <div className="wrap pt-12 pb-4 md:pt-16">
        <p className="kicker">
          <span className="kicker__idx">01</span>
          <span>Catalog</span>
          <span className="kicker__bar" aria-hidden />
        </p>
        <h1 className="h1-page mt-4">Shop</h1>
        <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
          <li className="flex items-center gap-2">
            <IconCheck className="h-4 w-4 text-primary" /> Order tracking on every purchase
          </li>
          <li className="flex items-center gap-2">
            <IconCheck className="h-4 w-4 text-primary" /> Transparent pricing, confirmed at
            checkout
          </li>
        </ul>
        <div className="mt-9">
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
      </div>

      <StepsSection no="02" images={stepImages} />
      <HelpBand no="03" config={config} image={result.products.find((p) => p.image)?.image || null} />

      <section className="sec sec--flat sec--line" aria-labelledby="shop-faq-heading">
        <div className="wrap">
          <SectionHead
            no="04"
            label="Good to know"
            title={
              <>
                Questions, <strong>answered.</strong>
              </>
            }
            id="shop-faq-heading"
          />
          <Faq items={faqItems(config)} />
        </div>
      </section>
    </>
  );
}
