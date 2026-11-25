import Link from "next/link";
import ProductCard from "@/components/ProductCard";
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
    <div data-reveal className="mb-9 flex items-end justify-between gap-4 border-t-2 border-cream/80 pt-5">
      <div className="flex items-baseline gap-4">
        <span aria-hidden className="font-display text-sm font-bold text-primary">{nextNo()}</span>
        <h2 id={id} className="font-display text-3xl font-extrabold uppercase tracking-tight text-cream sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-muted underline-offset-4 transition hover:text-primary hover:underline"
        >
          View all →
        </Link>
      )}
    </div>
  );

  return (
    <div className="pb-6">
      {/* Hero — magazine cover: display type first, product as the plate. */}
      <section className="pt-10 sm:pt-14">
        <div data-hero-fade className="flex items-center justify-between gap-4 border-t-2 border-cream/80 pt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-2">
          <span>{config.tagline || name}</span>
          <span className="hidden sm:block">{name} — Online Store</span>
        </div>

        <h1 className="mt-7 font-display text-[13vw] font-black uppercase leading-[0.95] tracking-[-0.02em] text-cream sm:text-7xl lg:text-[6.4rem]">
          <span className="block overflow-hidden pb-1">
            <span data-hero-line className="block">Upgrade Your</span>
          </span>{" "}
          <span className="block overflow-hidden pb-1">
            <span data-hero-line className="block">Everyday</span>
          </span>{" "}
          <span className="block overflow-hidden pb-2">
            <span data-hero-line className="block">
              Tech<span aria-hidden className="text-primary">.</span>
            </span>
          </span>
        </h1>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p data-hero-fade className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Headphones, speakers and everyday electronics — real products, honest prices, delivered to your door.
            </p>
            <div data-hero-fade className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/shop"
                className="inline-block bg-primary px-9 py-4 font-display text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-primary-dark active:scale-[0.98]"
              >
                Shop Now
              </Link>
              <Link
                href="#categories"
                className="inline-block border-b-2 border-cream/70 pb-1 font-display text-sm font-bold uppercase tracking-[0.1em] text-cream transition hover:border-primary hover:text-primary"
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
                <span className="relative block aspect-[4/3] overflow-hidden bg-ink-2">
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
                className={`group relative block overflow-hidden bg-surface ${
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
                <span aria-hidden className="absolute left-4 top-4 font-display text-sm font-bold text-white/80">
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
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {featured.products.map((product) => (
              <ProductCard key={product._id} product={product} currency={currency} />
            ))}
          </div>
        </section>
      )}

      {/* Promo banner */}
      <section data-reveal className="relative mt-24 overflow-hidden bg-primary px-6 py-14 sm:px-12">
        <span aria-hidden className="pointer-events-none absolute -right-6 -top-24 select-none font-display text-[13rem] font-black leading-none text-white/10">
          %
        </span>
        <div className="relative max-w-xl">
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">Up to 30% Off Audio</h2>
          <p className="mt-3 max-w-md text-base text-white/85">
            Selected headphones and speakers at their lowest prices — while stock lasts.
          </p>
          <Link
            href={audioCategory ? `/category/${audioCategory.slug}` : "/shop"}
            className="mt-8 inline-block bg-ink px-9 py-4 font-display text-sm font-bold uppercase tracking-[0.1em] text-cream transition hover:bg-ink-2 active:scale-[0.98]"
          >
            Shop the Sale
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      {arrivals.products.length > 0 && (
        <section aria-labelledby="arrivals-heading" className="mt-24">
          {sectionHead("arrivals-heading", "New Arrivals", "/shop?sort=newest")}
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
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
