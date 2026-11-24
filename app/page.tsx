import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { fetchCategories, fetchProducts, fetchStoreConfig, storeDisplayName } from "@/lib/api";

export default async function HomePage() {
  const [config, categories, featured, arrivals] = await Promise.all([
    fetchStoreConfig(),
    fetchCategories(),
    fetchProducts({ sort: "featured", limit: 4 }),
    fetchProducts({ sort: "newest", limit: 4 }),
  ]);
  const currency = config.currency;
  const name = storeDisplayName(config);
  const tiles = categories.filter((c) => c.productsCount > 0).slice(0, 6);
  const audioCategory = categories.find((c) => /audio/i.test(c.name) || /audio/i.test(c.slug));

  const sectionHead = (id: string, title: string, href: string) => (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <span aria-hidden className="mb-3 block h-1 w-10 rounded-full bg-primary" />
        <h2 id={id} className="text-3xl font-extrabold tracking-tight text-cream sm:text-4xl">{title}</h2>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-muted transition hover:border-primary hover:text-cream"
      >
        View all →
      </Link>
    </div>
  );

  return (
    <div className="pb-6">
      {/* Hero */}
      <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-line/60 bg-gradient-to-br from-surface-2 via-surface to-ink-2 px-6 py-16 sm:mt-10 sm:px-12 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,241,242,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,241,242,0.045) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(70% 90% at 30% 40%, black, transparent)",
            WebkitMaskImage: "radial-gradient(70% 90% at 30% 40%, black, transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-ink/50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted backdrop-blur">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
            {config.tagline || name}
          </p>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] tracking-[-0.03em] text-cream sm:text-6xl lg:text-[4.2rem]">
            Upgrade Your Everyday Tech
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Headphones, speakers and everyday electronics — real products, honest prices, delivered to your door.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-block rounded-full bg-primary px-8 py-3.5 text-base font-bold text-white shadow-glow transition hover:bg-primary-dark active:scale-[0.98]"
            >
              Shop Now
            </Link>
            <Link
              href="#categories"
              className="inline-block rounded-full border border-line px-8 py-3.5 text-base font-semibold text-cream transition hover:border-primary/60 hover:bg-surface/60"
            >
              Browse Categories
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <span aria-hidden className="font-bold text-primary">✓</span> Order tracking on every purchase
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="font-bold text-primary">✓</span> Transparent pricing, confirmed at checkout
            </li>
          </ul>
        </div>
      </section>

      {/* Category tiles */}
      {tiles.length > 0 && (
        <section id="categories" aria-label="Browse categories" className="mt-20 scroll-mt-32">
          <div className="mb-7">
            <span aria-hidden className="mb-3 block h-1 w-10 rounded-full bg-primary" />
            <h2 className="text-3xl font-extrabold tracking-tight text-cream sm:text-4xl">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
            {tiles.map((category) => (
              <Link
                key={category._id}
                href={`/category/${category.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-line/60 bg-surface transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-card"
              >
                {category.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.08]"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-5xl font-extrabold text-line">
                    {category.name.charAt(0)}
                  </span>
                )}
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block text-sm font-bold leading-tight text-cream">{category.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {category.productsCount} {category.productsCount === 1 ? "product" : "products"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.products.length > 0 && (
        <section aria-labelledby="featured-heading" className="mt-20">
          {sectionHead("featured-heading", "Featured Products", "/shop")}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.products.map((product) => (
              <ProductCard key={product._id} product={product} currency={currency} />
            ))}
          </div>
        </section>
      )}

      {/* Promo banner */}
      <section className="relative mt-20 overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-primary-dark px-6 py-12 sm:px-12 sm:py-14">
        <span aria-hidden className="pointer-events-none absolute -right-6 -top-20 select-none text-[12rem] font-black leading-none text-white/10">
          %
        </span>
        <div className="relative max-w-xl">
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Up to 30% Off Audio</h2>
          <p className="mt-3 max-w-md text-base text-white/85">
            Selected headphones and speakers at their lowest prices — while stock lasts.
          </p>
          <Link
            href={audioCategory ? `/category/${audioCategory.slug}` : "/shop"}
            className="mt-7 inline-block rounded-full bg-ink px-8 py-3 font-bold text-cream shadow-card transition hover:bg-ink-2 active:scale-[0.98]"
          >
            Shop the Sale
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      {arrivals.products.length > 0 && (
        <section aria-labelledby="arrivals-heading" className="mt-20">
          {sectionHead("arrivals-heading", "New Arrivals", "/shop?sort=newest")}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
