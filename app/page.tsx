import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { fetchCategories, fetchProducts, fetchStoreConfig } from "@/lib/api";

export default async function HomePage() {
  const [config, categories, featured, arrivals] = await Promise.all([
    fetchStoreConfig(),
    fetchCategories(),
    fetchProducts({ sort: "featured", limit: 4 }),
    fetchProducts({ sort: "newest", limit: 4 }),
  ]);
  const currency = config.currency;
  const circles = categories.filter((c) => c.productsCount > 0).slice(0, 6);
  const audioCategory = categories.find((c) => /audio/i.test(c.name) || /audio/i.test(c.slug));

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-surface px-6 py-14 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        />
        <h1 className="relative mx-auto max-w-2xl text-4xl font-extrabold leading-tight text-cream sm:text-5xl">
          Upgrade Your Everyday Tech
        </h1>
        <p className="relative mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
          Headphones, speakers and everyday electronics — real products, honest prices, delivered to your door.
        </p>
        <Link
          href="/shop"
          className="relative mt-8 inline-block rounded-full bg-primary px-8 py-3 text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-dark"
        >
          Shop Now
        </Link>
      </section>

      {/* Category circles */}
      {circles.length > 0 && (
        <section aria-label="Browse categories" className="mt-12">
          <div className="flex flex-wrap justify-center gap-5 sm:gap-8">
            {circles.map((category) => (
              <Link
                key={category._id}
                href={`/category/${category.slug}`}
                className="group flex w-24 flex-col items-center gap-2 text-center"
              >
                <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-line bg-surface transition group-hover:border-primary">
                  {category.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={category.image} alt={category.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-extrabold text-primary">{category.name.charAt(0)}</span>
                  )}
                </span>
                <span className="text-sm font-medium text-muted transition group-hover:text-cream">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.products.length > 0 && (
        <section aria-labelledby="featured-heading" className="mt-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 id="featured-heading" className="text-2xl font-bold text-cream">Featured Products</h2>
            <Link href="/shop" className="text-sm font-medium text-primary transition hover:text-cream">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.products.map((product) => (
              <ProductCard key={product._id} product={product} currency={currency} />
            ))}
          </div>
        </section>
      )}

      {/* Promo banner */}
      <section className="mt-14 overflow-hidden rounded-3xl bg-primary px-6 py-10 text-center sm:px-12">
        <h2 className="text-3xl font-extrabold text-white">Up to 30% Off Audio</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
          Selected headphones and speakers at their lowest prices — while stock lasts.
        </p>
        <Link
          href={audioCategory ? `/category/${audioCategory.slug}` : "/shop"}
          className="mt-6 inline-block rounded-full bg-ink px-7 py-2.5 font-bold text-cream transition hover:bg-ink-2"
        >
          Shop the Sale
        </Link>
      </section>

      {/* New arrivals */}
      {arrivals.products.length > 0 && (
        <section aria-labelledby="arrivals-heading" className="mt-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 id="arrivals-heading" className="text-2xl font-bold text-cream">New Arrivals</h2>
            <Link href="/shop?sort=newest" className="text-sm font-medium text-primary transition hover:text-cream">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {arrivals.products.map((product) => (
              <ProductCard key={product._id} product={product} currency={currency} />
            ))}
          </div>
        </section>
      )}

      {featured.products.length === 0 && arrivals.products.length === 0 && (
        <p className="mt-16 text-center text-muted">
          The catalog is being stocked — please check back soon.
        </p>
      )}
    </div>
  );
}
