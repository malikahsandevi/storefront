import Link from "next/link";
import ProductCard from "./ProductCard";
import type { CatalogCategory, CatalogProduct } from "@/lib/api";

export interface CatalogFilters {
  category?: string;
  q?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: number;
}

const SORTS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Highest rated" },
  { value: "name", label: "Name A–Z" },
];

function pageHref(basePath: string, filters: CatalogFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.min) params.set("min", filters.min);
  if (filters.max) params.set("max", filters.max);
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * The Shop/Category listing: a GET filter form (works without JS and
 * stays crawlable) + the product grid + pagination.
 */
export default function CatalogBrowser({
  basePath,
  categories,
  products,
  total,
  page,
  pages,
  filters,
  currency,
  lockedCategory,
}: {
  basePath: string;
  categories: CatalogCategory[];
  products: CatalogProduct[];
  total: number;
  page: number;
  pages: number;
  filters: CatalogFilters;
  currency: string;
  lockedCategory?: string;
}) {
  const topCategories = categories.filter((c) => !c.parent);
  const inputCls =
    "w-full rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-sm text-cream placeholder:text-muted-2";
  const labelCls = "mono-label mb-1.5 block text-muted-2";

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      <aside className="vault-panel h-fit p-6 lg:sticky lg:top-40">
        <form method="get" action={basePath} className="space-y-4">
          <div>
            <label htmlFor="f-q" className={labelCls}>Search</label>
            <input id="f-q" name="q" type="search" defaultValue={filters.q || ""} placeholder="Product name…" className={inputCls} />
          </div>
          {!lockedCategory && (
            <div>
              <label htmlFor="f-cat" className={labelCls}>Category</label>
              <select
                id="f-cat"
                name="category"
                defaultValue={filters.category || ""}
                className={inputCls}
              >
                <option value="">All categories</option>
                {topCategories.map((category) => (
                  <option key={category._id} value={category.slug}>{category.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="f-min" className={labelCls}>Min price</label>
              <input id="f-min" name="min" type="number" min="0" step="0.01" defaultValue={filters.min || ""} className={inputCls} />
            </div>
            <div>
              <label htmlFor="f-max" className={labelCls}>Max price</label>
              <input id="f-max" name="max" type="number" min="0" step="0.01" defaultValue={filters.max || ""} className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="f-sort" className={labelCls}>Sort by</label>
            <select id="f-sort" name="sort" defaultValue={filters.sort || "newest"} className={inputCls}>
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value}>{sort.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary-pill btn-shine w-full py-3 font-display text-[13px] font-bold uppercase tracking-[0.1em]">
            Apply Filters
          </button>
          <Link href={basePath} className="block text-center text-xs text-muted transition hover:text-cream">
            Clear all filters
          </Link>
        </form>
        {/* Category quick links (server-rendered, crawlable) */}
        {!lockedCategory && topCategories.length > 0 && (
          <nav aria-label="Categories" className="mt-7 border-t border-line pt-5">
            <p className="mono-label mb-1 text-muted-2">Categories</p>
            <ul className="divide-y divide-line text-sm">
              {topCategories.map((category) => (
                <li key={category._id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className={`-mx-2.5 block px-2.5 py-2 transition hover:text-cream ${filters.category === category.slug ? "font-bold text-primary" : "text-muted"}`}
                  >
                    {category.name}
                    <span className="text-muted-2"> ({category.productsCount})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </aside>

      <div>
        <p className="mono-label mb-5 text-muted-2" role="status">
          {total} {total === 1 ? "product" : "products"}
          {filters.q ? <> for “{filters.q}”</> : null}
        </p>
        {products.length === 0 ? (
          <div className="vault-panel p-12 text-center">
            <p className="font-semibold text-cream">No products match your filters.</p>
            <p className="mt-1 text-sm text-muted">Try a different search or clear the filters.</p>
            <Link href={basePath} className="btn-primary-pill btn-shine mt-5 inline-block px-6 py-3 font-display text-[13px] font-bold uppercase tracking-[0.1em]">
              Clear Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} currency={currency} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
            {page > 1 && (
              <Link href={pageHref(basePath, filters, page - 1)} className="btn-ghost-pill px-5 py-2.5 text-sm font-medium text-muted hover:text-cream">
                ← Previous
              </Link>
            )}
            <span className="btn-primary-pill px-4 py-2 text-sm font-semibold">
              Page {page} of {pages}
            </span>
            {page < pages && (
              <Link href={pageHref(basePath, filters, page + 1)} className="btn-ghost-pill px-5 py-2.5 text-sm font-medium text-muted hover:text-cream">
                Next →
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
