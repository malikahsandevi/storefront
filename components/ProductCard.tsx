import Link from "next/link";
import { discountPercent, formatMoney, type CatalogProduct } from "@/lib/api";
import { AddToCartButton, WishlistButton } from "./buttons";
import RatingStars from "./RatingStars";

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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-primary/60">
      <div className="relative aspect-square overflow-hidden bg-ink-2">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.images[0]?.alt || product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-4xl font-extrabold text-line">
              {product.name.charAt(0)}
            </span>
          )}
        </Link>
        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white">
            −{discount}%
          </span>
        )}
        {out && (
          <span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-semibold text-cream">
            Out of Stock
          </span>
        )}
        <WishlistButton product={product} className="absolute right-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.category && (
          <Link
            href={`/category/${product.category.slug}`}
            className="text-xs font-medium uppercase tracking-wide text-muted-2 transition hover:text-muted"
          >
            {product.category.name}
          </Link>
        )}
        <Link href={`/product/${product.slug}`} className="line-clamp-2 font-semibold leading-snug text-cream transition hover:text-white">
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
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-lg font-bold text-cream">{formatMoney(product.price, currency)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-sm text-muted-2 line-through">
              {formatMoney(product.comparePrice, currency)}
            </span>
          )}
        </div>
        <AddToCartButton product={product} className="mt-2 w-full px-4 py-2 text-sm" />
      </div>
    </article>
  );
}
