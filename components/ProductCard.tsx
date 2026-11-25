import Link from "next/link";
import { discountPercent, formatMoney, type CatalogProduct } from "@/lib/api";
import { AddToCartButton, QuickAddButton, WishlistButton } from "./buttons";
import RatingStars from "./RatingStars";

/**
 * The hodl "vcard": a vault panel (24px radius, hairline border,
 * surface-gradient fill) whose media sits on a radial accent glow.
 * Hover tints the border to the accent, blooms a deep accent shadow
 * and zooms the image over 1s. All strings are the catalog's own.
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
  return (
    <article data-reveal className="vcard group relative flex flex-col">
      <div className="media-glow relative aspect-square overflow-hidden">
        <Link href={`/product/${product.slug}`} aria-label={product.name} className="block h-full w-full">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.images[0]?.alt || product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-1000 group-hover:scale-[1.06]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-5xl font-black text-line">
              {product.name.charAt(0)}
            </span>
          )}
        </Link>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--sf-primary)_14%,transparent),transparent_60%)]"
        />
        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-glow">
            −{discount}%
          </span>
        )}
        {out && (
          <span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-cream backdrop-blur">
            Out of Stock
          </span>
        )}
        <WishlistButton product={product} className="absolute right-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-5">
        {product.category && (
          <Link
            href={`/category/${product.category.slug}`}
            className="mono-label text-muted-2 transition hover:text-primary"
          >
            {product.category.name}
          </Link>
        )}
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 font-display text-[21px] font-semibold leading-snug text-cream underline-offset-4 transition group-hover:underline"
        >
          {product.name}
        </Link>
        {product.reviewCount > 0 ? (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <RatingStars rating={product.averageRating} />
            {product.averageRating.toFixed(1)} ({product.reviewCount})
          </span>
        ) : (
          <span className="text-xs text-muted-2">No reviews yet</span>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="font-display text-[19px] font-extrabold tracking-tight text-cream">{formatMoney(product.price, currency)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-sm text-muted-2 line-through">
              {formatMoney(product.comparePrice, currency)}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <AddToCartButton product={product} className="flex-1 px-4 py-3 text-[13px]" />
          <QuickAddButton product={product} />
        </div>
      </div>
    </article>
  );
}
