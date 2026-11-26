import Link from "next/link";
import Faq from "@/components/Faq";
import Finder from "@/components/Finder";
import ProductCard from "@/components/ProductCard";
import SectionHead from "@/components/SectionHead";
import {
  FactsTicker,
  FinalCta,
  HelpBand,
  StepsSection,
  VerifyLedger,
  faqItems,
} from "@/components/Sections";
import { IconArrow, IconCheck } from "@/components/icons";
import {
  discountPercent,
  fetchCategories,
  fetchProducts,
  fetchStoreConfig,
  formatMoney,
  storeDisplayName,
} from "@/lib/api";

/**
 * Home, composed section-for-section like the reference store's
 * home: hero (badge pill, stacked display lines with the last in
 * the gradient, lead, pill CTAs, fact chips, and the dial-and-core
 * product visual) → facts ticker → promo banner → 01 new
 * arrivals → 02 category bento → 03 featured products →
 * 04 Product Finder → 05 the three-link chain → 06 verify
 * ledger → 07 help band → 08 FAQ → the closing rings CTA.
 * All content is this store's own: config, catalog, prices.
 */
export default async function HomePage() {
  const [config, categories, featured, arrivals, finderPool, catalog] = await Promise.all([
    fetchStoreConfig(),
    fetchCategories(),
    fetchProducts({ sort: "featured", limit: 4 }),
    fetchProducts({ sort: "newest", limit: 12 }),
    fetchProducts({ sort: "featured", limit: 24 }),
    fetchProducts({ sort: "newest", limit: 100 }),
  ]);
  const currency = config.currency;
  const name = storeDisplayName(config);
  const topCategories = categories.filter((c) => !c.parent);
  const tiles = categories.filter((c) => c.productsCount > 0).slice(0, 6);
  // New Arrivals never repeats what Featured Products already
  // shows: the featured four are removed and the row backfills
  // with the next newest, so it stays four wide when the
  // catalog allows.
  const featuredIds = new Set(featured.products.map((p) => p._id));
  const arrivalProducts = arrivals.products.filter((p) => !featuredIds.has(p._id)).slice(0, 4);
  const pool = [...featured.products, ...arrivals.products].filter(
    (p, i, arr) => arr.findIndex((x) => x._id === p._id) === i,
  );
  // The hero lead names only categories that actually carry
  // products right now — never a hard-coded department the
  // catalog may not have.
  const heroCategoryNames = tiles.slice(0, 2).map((c) => c.name);
  const heroLead =
    heroCategoryNames.length > 1
      ? `Shop ${heroCategoryNames.join(" and ")} — real products, honest prices, delivered to your door.`
      : heroCategoryNames.length === 1
        ? `Shop ${heroCategoryNames[0]} — real products, honest prices, delivered to your door.`
        : "Real products, honest prices, delivered to your door.";
  // The promo banner is computed from the live catalog, never
  // written by hand: a discount is claimed ONLY when a real
  // product carries that compare-at saving (the true maximum,
  // on that product's own category); with no sale running it
  // features the fullest real category instead, and with an
  // empty catalog it falls back to a claim the store always
  // honours — tracked delivery.
  const bestSaving = catalog.products
    .map((p) => ({ product: p, pct: discountPercent(p) }))
    .filter((x): x is { product: (typeof catalog.products)[number]; pct: number } => x.pct !== null)
    .sort((a, b) => b.pct - a.pct)[0];
  const fullestTile = tiles.reduce<(typeof tiles)[number] | null>(
    (best, tile) => (best === null || tile.productsCount > best.productsCount ? tile : best),
    null,
  );
  const promo = bestSaving
    ? {
        mark: "%",
        heading: `Up to ${bestSaving.pct}% Off ${bestSaving.product.category?.name || "Selected Products"}`,
        copy: `Selected ${bestSaving.product.category?.name || "products"} at their lowest prices — while stock lasts.`,
        href: bestSaving.product.category ? `/category/${bestSaving.product.category.slug}` : "/shop",
        cta: "Shop the Sale",
      }
    : fullestTile
      ? {
          mark: "✦",
          heading: `New in ${fullestTile.name}`,
          copy: `Fresh arrivals and everyday picks in ${fullestTile.name} — real stock, honest prices, and tracked delivery on every order.`,
          href: `/category/${fullestTile.slug}`,
          cta: `Browse ${fullestTile.name}`,
        }
      : {
          mark: "✦",
          heading: "Tracked Delivery on Every Order",
          copy: "Every purchase is confirmed by the store's own server and tracked from checkout to your door.",
          href: "/shop",
          cta: "Shop Now",
        };
  const heroProduct = pool.find((p) => p.image);
  const satellites = pool.filter((p) => p.image && p._id !== heroProduct?._id).slice(0, 3);
  const stepImages = [
    tiles[0]?.image || pool[0]?.image || null,
    tiles[1]?.image || pool[1]?.image || null,
    tiles[2]?.image || pool[2]?.image || null,
  ];
  const paymentNames = config.paymentMethods.map((m) => m.name).filter(Boolean);
  const facts = [
    `${featured.total} products in the catalog`,
    `${topCategories.length} categories`,
    "Order tracking on every purchase",
    ...(paymentNames.length ? [`Pay with ${paymentNames.join(" · ")}`] : ["Cash on Delivery available"]),
    "Transparent pricing, confirmed at checkout",
    ...(config.contactEmail ? [`Questions? ${config.contactEmail}`] : []),
  ];

  let n = 0;
  const no = () => String(++n).padStart(2, "0");

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <p className="hero__kicker">
              <span className="dot" aria-hidden />
              <span>{config.tagline || name}</span>
            </p>
            <h1 className="hero__h1">
              <span className="hero__line">Upgrade Your</span>{" "}
              <span className="hero__line">Everyday</span>{" "}
              <span className="hero__line hero__line--grad">
                <span className="grad-text">Life.</span>
              </span>
            </h1>
            <p className="hero__lead">{heroLead}</p>
            <div className="hero__ctas">
              <Link href="/shop" className="btn btn--primary">
                Shop Now <IconArrow className="arr h-[18px] w-[18px]" />
              </Link>
              <Link href="#categories" className="btn btn--ghost">
                Browse Categories
              </Link>
            </div>
            <ul className="hero__facts">
              <li className="chip">
                <IconCheck /> Order tracking on every purchase
              </li>
              <li className="chip">
                <IconCheck /> Transparent pricing, confirmed at checkout
              </li>
              {paymentNames.length > 0 && (
                <li className="chip">
                  <IconCheck /> Pay with {paymentNames[0]}
                  {paymentNames.length > 1 ? " & more" : ""}
                </li>
              )}
            </ul>
          </div>

          {heroProduct && (
            <div className="hero__visual">
              <svg className="hero__dial" viewBox="0 0 100 100" fill="none" aria-hidden>
                <g className="spin">
                  <circle cx="50" cy="50" r="49" stroke="var(--sf-primary)" strokeOpacity="0.4" strokeWidth="0.35" strokeDasharray="10 14" />
                </g>
                <g className="spin spin--rev">
                  <circle cx="50" cy="50" r="41" stroke="var(--sf-secondary)" strokeOpacity="0.45" strokeWidth="0.35" strokeDasharray="3 7" />
                </g>
              </svg>
              <Link href={`/product/${heroProduct.slug}`} className="hero__core" aria-label={heroProduct.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroProduct.image} alt={heroProduct.images[0]?.alt || heroProduct.name} loading="lazy" />
              </Link>
              {satellites.map((sat, i) => (
                <Link
                  key={sat._id}
                  href={`/product/${sat.slug}`}
                  className={`hero__sat hero__sat--${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sat.image} alt="" loading="lazy" />
                  <span className="hero__sat-t">
                    <small>{sat.category?.name || "Featured"}</small>
                    <span>
                      {sat.name} · {formatMoney(sat.price, currency)}
                    </span>
                  </span>
                </Link>
              ))}
              <p className="hero__status">
                <span className="dot" aria-hidden /> Tracked delivery on every order
              </p>
            </div>
          )}
        </div>
        <span className="hero__scroll" aria-hidden />
      </section>

      <FactsTicker categories={categories} facts={facts} />

      {/* ── Promo banner ─────────────────────────────────────── */}
      <section className="sec sec--flat" aria-label="Current offer">
        <div className="wrap">
          <div className="promo" data-reveal>
            <span className="promo__mark" aria-hidden>{promo.mark}</span>
            <div className="promo__inner">
              <h2 className="promo__h">{promo.heading}</h2>
              <p className="promo__x">{promo.copy}</p>
              <Link href={promo.href} className="promo__cta">
                {promo.cta} <IconArrow className="arr h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 01 New arrivals ──────────────────────────────────── */}
      {arrivalProducts.length > 0 && (
        <section className="sec sec--line" aria-labelledby="arrivals-heading">
          <div className="wrap">
            <SectionHead
              no={no()}
              label="New Arrivals"
              title={
                <>
                  New <strong>arrivals.</strong>
                </>
              }
              lead="The latest products added to the catalog."
              id="arrivals-heading"
              href="/shop?sort=newest"
              split
            />
            <div className="pgrid">
              {arrivalProducts.map((product) => (
                <ProductCard key={product._id} product={product} currency={currency} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 02 Categories bento ──────────────────────────────── */}
      {tiles.length > 0 && (
        <section id="categories" className="sec sec--flat sec--line scroll-mt-28" aria-labelledby="categories-heading">
          <div className="wrap">
            <SectionHead
              no={no()}
              label="Shop by Category"
              title={
                <>
                  Shop by <strong>category.</strong>
                </>
              }
              lead="Every category in the store."
              id="categories-heading"
              href="/shop"
              split
            />
            <div className="bento">
              {tiles.map((category) => (
                <Link key={category._id} href={`/category/${category.slug}`} className="tile" data-reveal>
                  {category.image && (
                    <span className="tile__media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={category.image} alt="" loading="lazy" />
                    </span>
                  )}
                  <span className="tile__body">
                    <span className="tile__name">{category.name}</span>
                    {category.description && <span className="tile__text">{category.description}</span>}
                    <span className="tile__foot">
                      <span className="tile__go">
                        Explore <IconArrow className="arr h-4 w-4" />
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 03 Featured products ─────────────────────────────── */}
      {featured.products.length > 0 && (
        <section className="sec sec--line" aria-labelledby="featured-heading">
          <div className="wrap">
            <SectionHead
              no={no()}
              label="Featured Products"
              title={
                <>
                  Featured <strong>products.</strong>
                </>
              }
              lead="Hand-picked from the live catalog — the same prices and stock you will see at checkout."
              id="featured-heading"
              href="/shop"
              split
            />
            <div className="pgrid">
              {featured.products.map((product) => (
                <ProductCard key={product._id} product={product} currency={currency} />
              ))}
            </div>
            <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-primary" /> Order tracking on every purchase
              </li>
              <li className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-primary" /> Transparent pricing, confirmed at
                checkout
              </li>
              <li className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-primary" /> Real stock counts, straight from
                the store
              </li>
            </ul>
          </div>
        </section>
      )}

      {/* ── 04 Product Finder ────────────────────────────────── */}
      <section className="sec sec--line" aria-label="Product finder">
        <div className="wrap find__grid">
          <div className="find__intro">
            <SectionHead
              no={no()}
              label="Product Finder"
              title={
                <>
                  Three questions. <strong>One clear recommendation.</strong>
                </>
              }
              lead="Answer three short questions and see which product from the live catalog fits — including its real price and stock."
            />
            <ul className="find__points">
              <li>
                <IconCheck /> Takes about 30 seconds
              </li>
              <li>
                <IconCheck /> No sign-up, and nothing is stored
              </li>
              <li>
                <IconCheck /> Prefer a human? The store answers directly — see the help section
                below
              </li>
            </ul>
          </div>
          <div data-reveal>
            <Finder products={finderPool.products} categories={categories} currency={currency} />
          </div>
        </div>
      </section>

      {/* ── 05 How ordering works ────────────────────────────── */}
      <StepsSection no={no()} images={stepImages} />

      {featured.products.length === 0 && arrivalProducts.length === 0 && (
        <section className="sec">
          <div className="wrap text-center">
            <p className="text-muted">The catalog is being stocked — please check back soon.</p>
          </div>
        </section>
      )}

      {/* ── 06 Verify ledger ─────────────────────────────────── */}
      <VerifyLedger
        no={no()}
        config={config}
        totalProducts={featured.total}
        categoryCount={topCategories.length}
      />

      {/* ── 07 Help band ─────────────────────────────────────── */}
      <HelpBand no={no()} config={config} image={pool[1]?.image || heroProduct?.image || null} />

      {/* ── 08 FAQ ───────────────────────────────────────────── */}
      <section className="sec sec--flat sec--line" aria-labelledby="faq-heading">
        <div className="wrap">
          <SectionHead
            no={no()}
            label="Good to know"
            title={
              <>
                Questions, <strong>answered.</strong>
              </>
            }
            id="faq-heading"
          />
          <Faq items={faqItems(config)} />
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <FinalCta config={config} />
    </>
  );
}
