"use client";

import Link from "next/link";
import { useCallback } from "react";
import { discountPercent, formatMoney, type CatalogProduct } from "@/lib/api";
import { AddToCartButton, QuickAddButton, WishlistButton } from "./buttons";
import RatingStars from "./RatingStars";

/**
 * The product card, section-for-section the reference store's
 * card: a 24px-radius panel whose square media sits on a radial
 * accent glow (image zooms 1.06 over 1s on hover, the border
 * blooms to the accent with a deep accent shadow, and a radial
 * mouse-glow follows the pointer), a solid discount pill and a
 * glass wishlist disc over the media, then category, name, rating,
 * a one-line tagline, the spec ledger, and the price foot with the
 * round quick-add — plus the full-width Add to Cart the previous
 * build carried. All strings are the catalog's own.
 */
export default function ProductCard({
  product,
  currency,
}: {
  product: CatalogProduct;
  currency: string;
}) {
  const discount = discountPercent(product);
  const out = product.stock <= 0;
  // The spec ledger: the product's own attributes when it has
  // them, otherwise its brand + SKU — real catalog fields only.
  const ledgerRows = product.attributes.length
    ? product.attributes.slice(0, 3).map((a) => ({ key: a.name, value: a.value }))
    : [
        ...(product.brand ? [{ key: "Brand", value: product.brand.name }] : []),
        { key: "SKU", value: product.sku },
      ];

  const onMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <article className="card group" data-reveal onMouseMove={onMove}>
      <div className="card__media">
        <Link href={`/product/${product.slug}`} aria-label={product.name} className="absolute inset-0 block">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.images[0]?.alt || product.name} loading="lazy" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-5xl text-line">
              {product.name.charAt(0)}
            </span>
          )}
        </Link>
        {discount && (
          <span className="absolute left-3.5 top-3.5 z-[2] rounded-full bg-primary px-2.5 py-1 font-display text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white shadow-glow">
            −{discount}%
          </span>
        )}
        {out && (
          <span className="absolute bottom-3.5 left-3.5 z-[2] rounded-full bg-black/60 px-2.5 py-1 font-display text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
            Out of Stock
          </span>
        )}
        <WishlistButton product={product} className="card__wish" />
      </div>

      <div className="card__body">
        {product.category && (
          <Link
            href={`/category/${product.category.slug}`}
            className="mono-label text-muted-2 transition hover:text-primary"
          >
            {product.category.name}
          </Link>
        )}
        <h3 className="card__name">
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        {product.reviewCount > 0 ? (
          <p className="card__rating">
            <RatingStars rating={product.averageRating} />
            <span>
              {product.averageRating.toFixed(1)} ({product.reviewCount})
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-2">No reviews yet</p>
        )}
        {product.description?.trim() && <p className="card__tag">{product.description.trim()}</p>}
        {ledgerRows.length > 0 && (
          <dl className="card__specs">
            {ledgerRows.map((row) => (
              <div key={row.key}>
                <dt>{row.key}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="card__foot">
          <p className="card__price">
            {formatMoney(product.price, currency)}
            {product.comparePrice && product.comparePrice > product.price && (
              <s>{formatMoney(product.comparePrice, currency)}</s>
            )}
          </p>
          <div className="card__actions">
            <Link href={`/product/${product.slug}`} className="open-btn">
              View
            </Link>
            <QuickAddButton product={product} />
          </div>
        </div>
        <AddToCartButton product={product} className="btn--sm mt-1 w-full" />
      </div>
    </article>
  );
}
