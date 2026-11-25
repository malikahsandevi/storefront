"use client";

import { useState } from "react";
import type { CatalogProduct } from "@/lib/api";
import { useShop } from "@/lib/store";

export function AddToCartButton({
  product,
  quantity = 1,
  variant,
  className = "",
  label = "Add to Cart",
}: {
  product: CatalogProduct;
  quantity?: number;
  variant?: string;
  className?: string;
  label?: string;
}) {
  const { addToCart } = useShop();
  const [added, setAdded] = useState(false);
  const out = product.stock <= 0;
  return (
    <button
      type="button"
      disabled={out}
      onClick={() => {
        addToCart(product, quantity, variant);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className={`font-display font-bold uppercase tracking-[0.08em] transition ${
        out
          ? "cursor-not-allowed rounded-full bg-surface-2 text-muted-2"
          : "btn-primary-pill btn-shine"
      } ${className}`}
    >
      {out ? "Out of Stock" : added ? "Added ✓" : label}
    </button>
  );
}

/** Circular "+" quick-add (hodl vcard footer action): one tap adds a
 *  single unit without leaving the grid. */
export function QuickAddButton({ product }: { product: CatalogProduct }) {
  const { addToCart } = useShop();
  const [added, setAdded] = useState(false);
  const out = product.stock <= 0;
  return (
    <button
      type="button"
      disabled={out}
      aria-label={out ? `${product.name} is out of stock` : `Quick add ${product.name} to cart`}
      title={out ? "Out of stock" : "Quick add to cart"}
      onClick={() => {
        addToCart(product, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold transition ${
        out
          ? "cursor-not-allowed border border-line text-muted-2"
          : "border border-primary/60 text-primary shadow-glow hover:bg-primary hover:text-white active:scale-95"
      }`}
    >
      <span aria-hidden>{added ? "✓" : "+"}</span>
    </button>
  );
}

export function WishlistButton({ product, className = "" }: { product: CatalogProduct; className?: string }) {
  const { toggleWishlist, isWishlisted } = useShop();
  const active = isWishlisted(product._id);
  return (
    <button
      type="button"
      onClick={() => toggleWishlist(product)}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition ${
        active
          ? "border-primary bg-primary text-white"
          : "border-line bg-ink/50 text-muted hover:border-primary hover:text-cream"
      } ${className}`}
    >
      <span aria-hidden>{active ? "♥" : "♡"}</span>
    </button>
  );
}
