"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiCall, formatMoney, type CatalogProduct } from "@/lib/api";
import { useShop, type ProductLike } from "@/lib/store";
import { useCartUI } from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";
import SectionHead from "@/components/SectionHead";

/** Wishlist: the previous build's server-mirrored entries, shown
 *  as vault cards; adding to cart pops the cart drawer. Below the
 *  list — and under the empty state, filling its void — a
 *  "You may also like these" rail (Ahsan, 2026-11-26): real
 *  catalog products (the newest published, the home page's own
 *  arrivals source), one line of house ProductCards, sideways-
 *  scrolling on small screens, and never a product the visitor
 *  has already saved. */
export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useShop();
  const { setOpen } = useCartUI();
  const [currency, setCurrency] = useState("USD");
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    apiCall<{ currency: string }>("GET", "/api/storefront/config")
      .then((config) => setCurrency(config.currency || "USD"))
      .catch(() => {});
    apiCall<{ products: CatalogProduct[] }>("GET", "/api/storefront/products?sort=newest&limit=8")
      .then((res) => setCatalog(res.products || []))
      .catch(() => {});
  }, []);

  const suggestions = catalog
    .filter((product) => !wishlist.some((entry) => entry.productId === product._id))
    .slice(0, 4);

  const rail = suggestions.length > 0 ? (
    <section className="mt-16" aria-labelledby="also-like-heading">
      <SectionHead
        no="02"
        label="More to explore"
        title={
          <>
            You may also <strong>like these</strong>
          </>
        }
        id="also-like-heading"
      />
      <div className="likerow mt-9">
        {suggestions.map((product) => (
          <ProductCard key={product._id} product={product} currency={currency} />
        ))}
      </div>
    </section>
  ) : null;

  if (wishlist.length === 0) {
    return (
      <div className="wrap py-12 md:py-16">
        <div className="py-6 text-center">
          <h1 className="h1-page">Wishlist</h1>
          <p className="mt-4 text-muted">You have not saved any products yet.</p>
          <Link href="/shop" className="btn btn--primary mt-7">
            Browse Products
          </Link>
        </div>
        {rail}
      </div>
    );
  }

  return (
    <div className="wrap py-12 md:py-16">
      <p className="kicker">
        <span className="kicker__idx">Saved</span>
        <span>Your picks</span>
        <span className="kicker__bar" aria-hidden />
      </p>
      <h1 className="h1-page mt-4">Wishlist</h1>
      <div className="mt-10 grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        {wishlist.map((entry) => {
          const like: ProductLike = {
            _id: entry.productId,
            slug: entry.slug,
            name: entry.name,
            image: entry.image,
            price: entry.price,
            comparePrice: entry.comparePrice,
            stock: entry.stock,
          };
          const discount = entry.comparePrice && entry.comparePrice > entry.price
            ? Math.round((1 - entry.price / entry.comparePrice) * 100)
            : null;
          const out = entry.stock <= 0;
          return (
            <article key={entry.productId} className="card group">
              <div className="card__media">
                <Link href={`/product/${entry.slug}`} className="absolute inset-0 block" aria-label={entry.name}>
                  {entry.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.image} alt={entry.name} loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-4xl text-line">
                      {entry.name.charAt(0)}
                    </span>
                  )}
                </Link>
                {discount && (
                  <span className="absolute left-3.5 top-3.5 z-[2] rounded-full bg-primary px-2.5 py-1 font-display text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white shadow-glow">
                    −{discount}%
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${entry.name} from wishlist`}
                  onClick={() => toggleWishlist(like)}
                  className="wish-btn is-on card__wish"
                >
                  ♥
                </button>
              </div>
              <div className="card__body">
                <h3 className="card__name">
                  <Link href={`/product/${entry.slug}`}>{entry.name}</Link>
                </h3>
                <div className="card__foot">
                  <p className="card__price">
                    {formatMoney(entry.price, currency)}
                    {entry.comparePrice && entry.comparePrice > entry.price && (
                      <s>{formatMoney(entry.comparePrice, currency)}</s>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={out}
                  onClick={() => {
                    addToCart(like);
                    setTimeout(() => setOpen(true), 350);
                  }}
                  className={`btn w-full ${out ? "cursor-not-allowed bg-surface-2 text-muted-2 shadow-none" : "btn--primary"}`}
                  style={{ minHeight: 46 }}
                >
                  {out ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {rail}
    </div>
  );
}
