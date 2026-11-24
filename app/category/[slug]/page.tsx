import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogBrowser, { type CatalogFilters } from "@/components/CatalogBrowser";
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

  return (
    <div className="py-8">
      <h1 className="text-3xl font-extrabold text-cream">{category.name}</h1>
      {category.description && <p className="mt-2 max-w-2xl text-muted">{category.description}</p>}
      <div className="mt-6">
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
  );
}
