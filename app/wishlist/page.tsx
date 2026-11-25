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
        <h1 className="font-display text-[clamp(2.1rem,4.5vw,3rem)] font-normal leading-[1.05] tracking-[-0.02em] text-cream">Wishlist</h1>
        <p className="mt-3 text-muted">You have not saved any products yet.</p>
        <Link href="/shop" className="btn-primary-pill btn-shine mt-6 inline-block px-8 py-4 font-display text-[13px] font-semibold uppercase tracking-[0.08em]">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="font-display text-[clamp(2.5rem,5.5vw,4rem)] font-normal leading-[1.02] tracking-[-0.02em] text-cream">Wishlist</h1>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            <article key={entry.productId} className="vcard group relative flex flex-col">
              <Link href={`/product/${entry.slug}`} className="media-glow relative block aspect-square overflow-hidden">
                {entry.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.image} alt={entry.name} loading="lazy" className="h-full w-full object-cover transition duration-1000 group-hover:scale-[1.06]" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-display text-4xl font-black text-line">
                    {entry.name.charAt(0)}
                  </span>
                )}
                {discount && (
                  <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-glow">−{discount}%</span>
                )}
              </Link>
              <button
                type="button"
                aria-label={`Remove ${entry.name} from wishlist`}
                onClick={() => toggleWishlist(like)}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary bg-primary text-white shadow-glow backdrop-blur-md transition hover:bg-primary-dark"
              >
                ♥
              </button>
              <div className="flex flex-1 flex-col gap-1.5 p-5">
                <Link href={`/product/${entry.slug}`} className="line-clamp-2 font-display text-[21px] font-semibold leading-snug text-cream underline-offset-4 group-hover:underline">
                  {entry.name}
                </Link>
                <div className="mt-auto flex items-baseline gap-2 pt-3">
                  <span className="font-display text-[19px] font-extrabold tracking-tight text-cream">{formatMoney(entry.price, currency)}</span>
                  {entry.comparePrice && entry.comparePrice > entry.price && (
                    <span className="text-sm text-muted-2 line-through">{formatMoney(entry.comparePrice, currency)}</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={entry.stock <= 0}
                  onClick={() => addToCart(like)}
                  className={`mt-3 w-full px-4 py-3 font-display text-[13px] font-bold uppercase tracking-[0.08em] ${
                    entry.stock <= 0 ? "cursor-not-allowed rounded-full bg-surface-2 text-muted-2" : "btn-primary-pill btn-shine"
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
