"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiCall, formatMoney } from "@/lib/api";
import { useShop, type ProductLike } from "@/lib/store";

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useShop();
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    apiCall<{ currency: string }>("GET", "/api/storefront/config")
      .then((config) => setCurrency(config.currency || "USD"))
      .catch(() => {});
  }, []);

  if (wishlist.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-cream">Wishlist</h1>
        <p className="mt-3 text-muted">You have not saved any products yet.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-primary px-8 py-3 font-bold text-white shadow-glow transition hover:bg-primary-dark">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-4xl font-extrabold tracking-tight text-cream">Wishlist</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          return (
            <article key={entry.productId} className="group relative flex flex-col overflow-hidden rounded-3xl border border-line/70 bg-surface transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-card">
              <Link href={`/product/${entry.slug}`} className="relative block aspect-square overflow-hidden bg-ink-2">
                {entry.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.image} alt={entry.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.08]" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-4xl font-extrabold text-line">
                    {entry.name.charAt(0)}
                  </span>
                )}
                {discount && (
                  <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-glow">−{discount}%</span>
                )}
              </Link>
              <button
                type="button"
                aria-label={`Remove ${entry.name} from wishlist`}
                onClick={() => toggleWishlist(like)}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-glow"
              >
                ♥
              </button>
              <div className="flex flex-1 flex-col gap-1.5 p-5">
                <Link href={`/product/${entry.slug}`} className="line-clamp-2 text-[15px] font-semibold text-cream">
                  {entry.name}
                </Link>
                <div className="mt-auto flex items-baseline gap-2 pt-2">
                  <span className="text-xl font-extrabold tracking-tight text-cream">{formatMoney(entry.price, currency)}</span>
                  {entry.comparePrice && entry.comparePrice > entry.price && (
                    <span className="text-sm text-muted-2 line-through">{formatMoney(entry.comparePrice, currency)}</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={entry.stock <= 0}
                  onClick={() => addToCart(like)}
                  className={`mt-3 w-full rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    entry.stock <= 0 ? "cursor-not-allowed bg-surface-2 text-muted-2" : "bg-primary text-white shadow-glow hover:bg-primary-dark active:scale-[0.98]"
                  }`}
                >
                  {entry.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
