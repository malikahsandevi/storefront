import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SectionHead from "@/components/SectionHead";
import { fetchCategories, fetchProducts, fetchStoreConfig, formatMoney, storeDisplayName } from "@/lib/api";

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
  const heroProduct = featured.products.find((p) => p.image) || arrivals.products.find((p) => p.image);

  let sectionNo = 0;
  const nextNo = () => String(++sectionNo).padStart(2, "0");

  const sectionHead = (id: string, title: string, href?: string) => (
    <SectionHead no={nextNo()} title={title} id={id} href={href} />
  );

  return (
    <div className="pb-6">
      {/* Hero — the hodl composition: badge pill, stacked display
          lines (last line in the accent gradient), lead, pill CTAs,
          checklist, and the product plate over layered glows. Copy,
          links and GSAP hooks are the store's own. */}
      <section className="relative pt-10 sm:pt-14">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-28 left-1/2 h-96 w-[62rem] max-w-none -translate-x-1/2 rounded-full blur-2xl bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sf-primary)_13%,transparent),transparent)]"
        />
        <div className="relative grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p
              data-hero-fade
              className="inline-flex items-center gap-2.5 rounded-full border border-line py-2 pl-3 pr-4 bg-[color-mix(in_srgb,var(--sf-text)_3%,transparent)]"
            >
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-glow" />
              <span className="mono-label text-[11.5px] text-cream/85">{config.tagline || name}</span>
            </p>

            <h1 className="mt-7 font-display text-[clamp(2.9rem,7.2vw,5rem)] font-semibold uppercase leading-[1.03] tracking-[-0.03em] text-cream">
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="block">Upgrade Your</span>
              </span>{" "}
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="block">Everyday</span>
              </span>{" "}
              <span className="block overflow-hidden pb-2">
                <span data-hero-line className="block">
                  <span className="grad-text">Tech.</span>
                </span>
              </span>
            </h1>
            <p data-hero-fade className="mt-6 max-w-[31em] text-[clamp(0.97rem,1.22vw,1.125rem)] leading-[1.65] text-muted">
              Headphones, speakers and everyday electronics — real products, honest prices, delivered to your door.
            </p>
            <div data-hero-fade className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/shop"
                className="btn-primary-pill btn-shine inline-flex min-h-[54px] items-center gap-2.5 px-[26px] font-display text-sm font-semibold uppercase tracking-[0.08em]"
              >
                Shop Now <span aria-hidden>→</span>
              </Link>
              <Link
                href="#categories"
                className="btn-ghost-pill inline-flex min-h-[54px] items-center px-[26px] font-display text-sm font-semibold uppercase tracking-[0.08em] text-cream"
              >
                Browse Categories
              </Link>
            </div>
            <ul data-hero-fade className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <span aria-hidden className="font-bold text-primary">✓</span> Order tracking on every purchase
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="font-bold text-primary">✓</span> Transparent pricing, confirmed at checkout
              </li>
            </ul>
          </div>

          {heroProduct && (
            <figure data-hero-fade className="lg:col-span-5">
              <Link href={`/product/${heroProduct.slug}`} className="group block">
                <span className="media-glow relative block aspect-[4/3] overflow-hidden rounded-[24px] border border-line">
                  <span data-parallax className="absolute left-0 top-[-10%] block h-[120%] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroProduct.image}
                      alt={heroProduct.images[0]?.alt || heroProduct.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  </span>
                </span>
                <figcaption className="flex items-baseline justify-between gap-3 border-b border-line py-3">
                  <span className="font-display text-sm font-semibold text-cream underline-offset-4 group-hover:underline">
                    {heroProduct.name}
                  </span>
                  <span className="font-display text-sm font-extrabold text-primary">
                    {formatMoney(heroProduct.price, currency)}
                  </span>
                </figcaption>
              </Link>
            </figure>
          )}
        </div>
      </section>

      {/* Facts strip — hodl's quiet mono ledger under the hero,
          filled with this store's real catalog facts. */}
      <section data-reveal aria-label="Store facts" className="mt-16 border-y border-line">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 py-5 sm:grid-cols-3">
          <div className="flex items-baseline justify-between gap-4 sm:justify-start sm:gap-6">
            <dt className="mono-label text-muted-2">Catalog</dt>
            <dd className="text-sm text-cream">
              {featured.total} {featured.total === 1 ? "product" : "products"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 sm:justify-start sm:gap-6">
            <dt className="mono-label text-muted-2">Categories</dt>
            <dd className="text-sm text-cream">
              {categories.filter((c) => !c.parent).length} categories
            </dd>
          </div>
          {config.paymentMethods.length > 0 && (
            <div className="flex items-baseline justify-between gap-4 sm:justify-start sm:gap-6">
              <dt className="mono-label shrink-0 text-muted-2">Pay with</dt>
              <dd className="truncate text-sm text-cream">
                {config.paymentMethods.map((m) => m.name).join(" · ")}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* Category bento (V4) */}
      {tiles.length > 0 && (
        <section id="categories" aria-label="Browse categories" className="mt-24 scroll-mt-32">
          {sectionHead("categories-heading", "Shop by Category")}
          <div className="grid auto-rows-[10.5rem] grid-cols-2 gap-4 sm:auto-rows-[12.5rem] lg:grid-cols-4">
            {tiles.map((category, i) => (
              <Link
                key={category._id}
                data-reveal
                href={`/category/${category.slug}`}
                className={`group relative block overflow-hidden rounded-[24px] border border-line bg-surface transition hover:border-primary/60 ${
                  i === 0 ? "col-span-2 row-span-2" : i === 3 ? "lg:col-span-2" : ""
                }`}
              >
                {category.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-display text-6xl font-black text-line">
                    {category.name.charAt(0)}
                  </span>
                )}
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(circle_at_85%_8%,color-mix(in_srgb,var(--sf-primary)_26%,transparent),transparent_55%)]"
                />
                <span aria-hidden className="mono-label absolute left-4 top-4 text-white/85">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block font-display text-base font-bold uppercase leading-tight tracking-wide text-cream">
                    {category.name}
                  </span>
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
        <section aria-labelledby="featured-heading" className="mt-24">
          {sectionHead("featured-heading", "Featured Products", "/shop")}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.products.map((product) => (
              <ProductCard key={product._id} product={product} currency={currency} />
            ))}
          </div>
        </section>
      )}

      {/* Promo banner — accent-gradient vault panel, shine-sweep CTA */}
      <section data-reveal className="grad-primary relative mt-24 overflow-hidden rounded-[24px] px-6 py-14 shadow-glow sm:px-12">
        <span aria-hidden className="pointer-events-none absolute -right-6 -top-24 select-none font-display text-[13rem] font-black leading-none text-white/10">
          %
        </span>
        <div className="relative max-w-xl">
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.875rem)] font-normal leading-[1.04] tracking-[-0.02em] text-white [text-wrap:balance]">Up to 30% Off Audio</h2>
          <p className="mt-3 max-w-md text-base text-white/85">
            Selected headphones and speakers at their lowest prices — while stock lasts.
          </p>
          <Link
            href={audioCategory ? `/category/${audioCategory.slug}` : "/shop"}
            className="btn-shine mt-8 inline-block rounded-full bg-ink px-9 py-4 font-display text-sm font-bold uppercase tracking-[0.1em] text-cream transition hover:bg-ink-2 active:scale-[0.98]"
          >
            Shop the Sale
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      {arrivals.products.length > 0 && (
        <section aria-labelledby="arrivals-heading" className="mt-24">
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
