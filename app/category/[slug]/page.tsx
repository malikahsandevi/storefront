import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogBrowser, { type CatalogFilters } from "@/components/CatalogBrowser";
import Faq from "@/components/Faq";
import SectionHead from "@/components/SectionHead";
import { HelpBand, StepsSection, faqItems } from "@/components/Sections";
import { IconCheck } from "@/components/icons";
import { SITE_URL, fetchCategories, fetchProducts, fetchStoreConfig } from "@/lib/api";

async function findCategory(slug: string) {
  const categories = await fetchCategories();
  return categories.find((c) => c.slug === slug) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategory(slug);
  if (!category) return { title: "Category not found" };
  const description =
    category.description ||
    `Shop ${category.name} — browse products, compare prices and order online with tracked delivery.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: `${SITE_URL}/category/${category.slug}` },
    openGraph: {
      title: category.name,
      description,
      url: `${SITE_URL}/category/${category.slug}`,
      ...(category.image ? { images: [{ url: category.image, alt: category.name }] } : {}),
    },
  };
}

/** A category collection: same composition as the shop page,
 *  headed by the category's own name and description. */
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await findCategory(slug);
  if (!category) notFound();

  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const filters: CatalogFilters = {
    q: one(query.q),
    min: one(query.min),
    max: one(query.max),
    sort: one(query.sort) || "newest",
    page: Math.max(1, parseInt(one(query.page) || "1", 10) || 1),
  };
  const [config, categories, result] = await Promise.all([
    fetchStoreConfig(),
    fetchCategories(),
    fetchProducts({
      category: slug,
      search: filters.q,
      minPrice: filters.min,
      maxPrice: filters.max,
      sort: filters.sort,
      page: filters.page,
      limit: 24,
    }),
  ]);
  const stepImages = [
    category.image || null,
    categories.filter((c) => c.image && c.slug !== slug)[0]?.image || null,
    categories.filter((c) => c.image && c.slug !== slug)[1]?.image || null,
  ];

  return (
    <>
      <div className="wrap pt-12 pb-4 md:pt-16">
        <p className="kicker">
          <span className="kicker__idx">01</span>
          <span>Category</span>
          <span className="kicker__bar" aria-hidden />
        </p>
        <h1 className="h1-page mt-4">{category.name}</h1>
        {category.description && <p className="lead mt-4">{category.description}</p>}
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
            basePath={`/category/${slug}`}
            categories={categories}
            products={result.products}
            total={result.total}
            page={result.page}
            pages={result.pages}
            filters={filters}
            currency={config.currency}
            lockedCategory={slug}
          />
        </div>
      </div>

      <StepsSection no="02" images={stepImages} />
      <HelpBand no="03" config={config} image={category.image || result.products.find((p) => p.image)?.image || null} />

      <section className="sec sec--flat sec--line" aria-labelledby="cat-faq-heading">
        <div className="wrap">
          <SectionHead
            no="04"
            label="Good to know"
            title={
              <>
                Questions, <strong>answered.</strong>
              </>
            }
            id="cat-faq-heading"
          />
          <Faq items={faqItems(config)} />
        </div>
      </section>
    </>
  );
}
