"use client";

import { useState } from "react";
import { discountPercent, formatMoney, type CatalogProduct } from "@/lib/api";
import { useShop } from "@/lib/store";
import { useCartUI } from "./CartDrawer";
import RatingStars from "./RatingStars";

/**
 * Product media, in the reference treatment: the shot sits in a
 * 24px-radius panel over layered radial accent glows, with a deep
 * accent shadow under the panel; thumbnails below ring the active
 * one in the accent. The discount rides a solid accent pill.
 */
export function ProductGallery({ product }: { product: CatalogProduct }) {
  const images = product.images.length
    ? product.images
    : product.image
      ? [{ url: product.image, alt: product.name, isMain: true }]
      : [];
  const [active, setActive] = useState(0);
  const current = images[active] || images[0];
  const discount = discountPercent(product);
  return (
    <div>
      <div className="panel relative aspect-square overflow-hidden shadow-[0_40px_80px_-40px_var(--sf-glow)]">
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,color-mix(in_srgb,var(--sf-primary)_22%,transparent),transparent_55%),radial-gradient(circle_at_78%_85%,color-mix(in_srgb,var(--sf-secondary)_18%,transparent),transparent_55%)]"
        />
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.alt || product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display text-6xl text-line">
            {product.name.charAt(0)}
          </span>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--sf-primary)_12%,transparent),transparent_55%)]"
        />
        {discount && (
          <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 font-display text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-glow">
            −{discount}%
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
              className={`h-20 w-20 overflow-hidden rounded-2xl border-2 transition ${
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

/**
 * The buy box: price in the display font with the compare price
 * struck through and the reference store's shipping note under it,
 * variant pills (selected = the accent gradient), a pill quantity
 * stepper, a full-width gradient Add to Cart that pops the cart
 * drawer, the wishlist as a ghost pill beside it, and the rating
 * line closing the box.
 */
export function BuyPanel({
  product,
  currency,
  deliveryNote,
}: {
  product: CatalogProduct;
  currency: string;
  /** The truthful delivery line under the price, computed by the
   *  page from the store's configured shipping methods; absent
   *  (unconfigured) the panel keeps the plain checkout note. */
  deliveryNote?: string | null;
}) {
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const { setOpen } = useCartUI();
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);
  const out = product.stock <= 0;
  const variantLabel =
    Object.entries(variant)
      .map(([name, option]) => `${name}: ${option}`)
      .join(", ") || undefined;
  const wishlisted = isWishlisted(product._id);

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-[2.6rem] font-semibold leading-none tracking-[-0.01em] text-cream">
          {formatMoney(product.price, currency)}
        </span>
        {product.comparePrice && product.comparePrice > product.price && (
          <span className="text-xl text-muted-2 line-through">
            {formatMoney(product.comparePrice, currency)}
          </span>
        )}
      </div>
      <p className="mt-2.5 text-[13px] text-muted-2">
        {deliveryNote || "Shipping calculated at checkout."}
      </p>
      <p className={`mt-3.5 flex items-center gap-2 text-sm font-medium ${out ? "text-primary" : "text-emerald-400"}`}>
        <span aria-hidden className={`h-2 w-2 rounded-full ${out ? "bg-primary" : "bg-emerald-400"}`} />
        {out ? "Out of stock" : `In stock — ${product.stock} available`}
      </p>

      {product.variants.map((group) => (
        <fieldset key={group.name} className="mt-6">
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
                  className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                    selected
                      ? "text-white shadow-glow [background:var(--grad-btn)]"
                      : "border border-line bg-surface text-muted hover:border-primary hover:text-cream"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="buyrow mt-8 flex flex-wrap items-stretch gap-3">
        <div className="stepper">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span aria-live="polite">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(product.stock || q + 1, q + 1))}
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
            setTimeout(() => {
              setAdded(false);
              setOpen(true);
            }, 350);
          }}
          className={
            out
              ? "btn buyrow__add flex-1 cursor-not-allowed bg-surface-2 text-muted-2 shadow-none"
              : "btn btn--primary buyrow__add flex-1"
          }
        >
          {out ? "Out of Stock" : added ? "Added to Cart ✓" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-pressed={wishlisted}
          className={`btn buyrow__wish ${wishlisted ? "btn--primary" : "btn--ghost"}`}
        >
          {wishlisted ? "♥ Wishlisted" : "♡ Wishlist"}
        </button>
      </div>

      {product.reviewCount > 0 && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted">
          <RatingStars rating={product.averageRating} className="text-primary" />
          {product.averageRating.toFixed(1)} · {product.reviewCount}{" "}
          {product.reviewCount === 1 ? "review" : "reviews"}
        </p>
      )}
    </div>
  );
}
