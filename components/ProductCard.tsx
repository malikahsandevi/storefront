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
    <article data-reveal className="group relative flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-ink-2">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.images[0]?.alt || product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-5xl font-black text-line">
              {product.name.charAt(0)}
            </span>
          )}
        </Link>
        {discount && (
          <span className="absolute left-0 top-3 bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
            −{discount}%
          </span>
        )}
        {out && (
          <span className="absolute bottom-3 left-0 bg-ink/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-cream backdrop-blur">
            Out of Stock
          </span>
        )}
        <WishlistButton product={product} className="absolute right-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 border-t-2 border-cream/70 pt-4">
        {product.category && (
          <Link
            href={`/category/${product.category.slug}`}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-2 transition hover:text-primary"
          >
            {product.category.name}
          </Link>
        )}
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 font-display text-base font-semibold leading-snug text-cream underline-offset-4 transition group-hover:underline"
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
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-display text-lg font-extrabold tracking-tight text-cream">{formatMoney(product.price, currency)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-sm text-muted-2 line-through">
              {formatMoney(product.comparePrice, currency)}
            </span>
          )}
        </div>
        <AddToCartButton product={product} className="mt-3 w-full px-4 py-3 text-[13px]" />
      </div>
    </article>
  );
}
