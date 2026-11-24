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
      className={`rounded-full font-semibold transition ${
        out
          ? "cursor-not-allowed bg-surface-2 text-muted-2"
          : "bg-primary text-white hover:bg-primary-dark"
      } ${className}`}
    >
      {out ? "Out of Stock" : added ? "Added ✓" : label}
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
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
        active
          ? "border-primary bg-primary text-white"
          : "border-line bg-ink/60 text-muted hover:border-primary hover:text-cream"
      } ${className}`}
    >
      <span aria-hidden>{active ? "♥" : "♡"}</span>
    </button>
  );
}
