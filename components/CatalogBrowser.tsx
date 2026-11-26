import Link from "next/link";
import CustomSelect from "./CustomSelect";
import FilterBar from "./FilterBar";
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
 * The collection listing in the reference layout: a facet bar
 * (one panel, GET form — works without JS and stays crawlable)
 * above a four-column card grid, a category chip row, and ghost
 * pill pagination. All filters map to the same query parameters
 * as before.
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
  const activeCount =
    (filters.q ? 1 : 0) +
    (!lockedCategory && filters.category ? 1 : 0) +
    (filters.min ? 1 : 0) +
    (filters.max ? 1 : 0) +
    (filters.sort && filters.sort !== "newest" ? 1 : 0);

  return (
    <div>
      <FilterBar activeCount={activeCount}>
      <form
        method="get"
        action={basePath}
        className="panel panel--pad grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_0.7fr_0.7fr_1fr_auto] xl:items-end"
      >
        <div>
          <label htmlFor="f-q" className="flabel">Search</label>
          <input id="f-q" name="q" type="search" defaultValue={filters.q || ""} placeholder="Product name…" className="input" />
        </div>
        {!lockedCategory && (
          <div>
            <label htmlFor="f-cat" className="flabel">Category</label>
            <CustomSelect
              id="f-cat"
              name="category"
              defaultValue={filters.category || ""}
              ariaLabel="Category"
              options={[
                { value: "", label: "All categories" },
                ...topCategories.map((category) => ({ value: category.slug, label: category.name })),
              ]}
            />
          </div>
        )}
        <div>
          <label htmlFor="f-min" className="flabel">Min price</label>
          <input id="f-min" name="min" type="number" min="0" step="0.01" defaultValue={filters.min || ""} className="input" />
        </div>
        <div>
          <label htmlFor="f-max" className="flabel">Max price</label>
          <input id="f-max" name="max" type="number" min="0" step="0.01" defaultValue={filters.max || ""} className="input" />
        </div>
        <div>
          <label htmlFor="f-sort" className="flabel">Sort by</label>
          <CustomSelect
            id="f-sort"
            name="sort"
            defaultValue={filters.sort || "newest"}
            ariaLabel="Sort by"
            options={SORTS}
          />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn--primary btn--sm">
            Apply Filters
          </button>
          <Link href={basePath} className="whitespace-nowrap text-[13px] text-muted transition hover:text-cream">
            Clear all filters
          </Link>
        </div>
      </form>
      </FilterBar>

      {!lockedCategory && topCategories.length > 0 && (
        <nav aria-label="Categories" className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mono-label mr-1 text-muted-2">Categories</span>
          {topCategories.map((category) => (
            <Link
              key={category._id}
              href={`/category/${category.slug}`}
              className={`chip transition hover:border-primary ${filters.category === category.slug ? "!border-primary text-primary" : ""}`}
            >
              {category.name} · {category.productsCount}
            </Link>
          ))}
        </nav>
      )}

      <p className="mono-label mb-0 mt-10 text-muted-2" role="status">
        {total} {total === 1 ? "product" : "products"}
        {filters.q ? <> for “{filters.q}”</> : null}
      </p>

      {products.length === 0 ? (
        <div className="panel panel--pad mt-6 text-center">
          <p className="font-semibold text-cream">No products match your filters.</p>
          <p className="mt-1.5 text-sm text-muted">Try a different search or clear the filters.</p>
          <Link href={basePath} className="btn btn--primary btn--sm mt-5">
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-[18px] lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} currency={currency} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Link href={pageHref(basePath, filters, page - 1)} className="btn btn--ghost btn--sm">
              ← Previous
            </Link>
          )}
          <span className="btn btn--primary btn--sm pointer-events-none">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={pageHref(basePath, filters, page + 1)} className="btn btn--ghost btn--sm">
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
