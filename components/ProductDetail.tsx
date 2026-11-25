"use client";

import { useState } from "react";
import { discountPercent, formatMoney, type CatalogProduct } from "@/lib/api";
import { useShop } from "@/lib/store";
import RatingStars from "./RatingStars";

export function ProductGallery({ product }: { product: CatalogProduct }) {
  const images = product.images.length
    ? product.images
    : product.image
      ? [{ url: product.image, alt: product.name, isMain: true }]
      : [];
  const [active, setActive] = useState(0);
  const current = images[active] || images[0];
  return (
    <div>
      <div className="relative aspect-square overflow-hidden border border-line bg-ink-2">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt={current.alt || product.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-6xl font-black text-line">
            {product.name.charAt(0)}
          </span>
        )}
        {discountPercent(product) && (
          <span className="absolute left-0 top-4 bg-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white">
            −{discountPercent(product)}%
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2.5">
          {images.map((image, i) => (
            <button
              key={`${image.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`h-20 w-20 overflow-hidden border-2 transition ${
                i === active ? "border-primary" : "border-line hover:border-muted-2"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BuyPanel({ product, currency }: { product: CatalogProduct; currency: string }) {
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);
  const out = product.stock <= 0;
  const variantLabel = Object.entries(variant)
    .map(([name, option]) => `${name}: ${option}`)
    .join(", ") || undefined;
  const wishlisted = isWishlisted(product._id);

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-[2.6rem] font-black leading-none tracking-tight text-cream">{formatMoney(product.price, currency)}</span>
        {product.comparePrice && product.comparePrice > product.price && (
          <span className="text-xl text-muted-2 line-through">{formatMoney(product.comparePrice, currency)}</span>
        )}
      </div>
      <p className={`mt-3 flex items-center gap-2 text-sm font-medium ${out ? "text-primary" : "text-emerald-400"}`}>
        <span aria-hidden className={`h-2 w-2 rounded-full ${out ? "bg-primary" : "bg-emerald-400"}`} />
        {out ? "Out of stock" : `In stock — ${product.stock} available`}
      </p>

      {product.variants.map((group) => (
        <fieldset key={group.name} className="mt-5">
          <legend className="text-sm font-bold text-cream">{group.name}</legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {group.options.map((option) => {
              const selected = variant[group.name] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setVariant((prev) => ({ ...prev, [group.name]: option }))}
                  aria-pressed={selected}
                  className={`border px-4 py-2 text-sm font-medium transition ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface text-muted hover:border-primary hover:text-cream"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="flex items-center border border-line bg-surface">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3.5 py-2.5 text-lg text-muted transition hover:text-cream"
          >
            −
          </button>
          <span className="min-w-8 text-center font-semibold" aria-live="polite">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(product.stock || q + 1, q + 1))}
            className="px-3.5 py-2.5 text-lg text-muted transition hover:text-cream"
          >
            +
          </button>
        </div>
        <button
          type="button"
          disabled={out}
          onClick={() => {
            addToCart(product, qty, variantLabel);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
          className={`flex-1 px-6 py-3.5 font-display text-sm font-bold uppercase tracking-[0.08em] transition ${
            out ? "cursor-not-allowed bg-surface-2 text-muted-2" : "bg-primary text-white hover:bg-primary-dark active:scale-[0.98]"
          }`}
        >
          {out ? "Out of Stock" : added ? "Added to Cart ✓" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-pressed={wishlisted}
          className={`border px-5 py-3 font-semibold transition ${
            wishlisted
              ? "border-primary bg-primary text-white"
              : "border-line text-muted hover:border-primary hover:text-cream"
          }`}
        >
          {wishlisted ? "♥ Wishlisted" : "♡ Wishlist"}
        </button>
      </div>

      {product.reviewCount > 0 && (
        <p className="mt-5 flex items-center gap-2 text-sm text-muted">
          <RatingStars rating={product.averageRating} />
          {product.averageRating.toFixed(1)} · {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
        </p>
      )}
      <dl className="mt-6 space-y-1.5 border-t border-line/60 pt-5 text-sm text-muted">
        <div className="flex gap-2">
          <dt className="text-muted-2">SKU:</dt>
          <dd>{product.sku}</dd>
        </div>
        {product.brand && (
          <div className="flex gap-2">
            <dt className="text-muted-2">Brand:</dt>
            <dd>{product.brand.name}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
