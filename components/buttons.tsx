"use client";

import { useState } from "react";
import type { CatalogProduct } from "@/lib/api";
import { useShop } from "@/lib/store";
import { useCartUI } from "./CartDrawer";

/**
 * The card and buy-box actions. Same wiring as before (the shop
 * store's addToCart / toggleWishlist); the one behaviour the
 * reference store adds is the cart pop-up — a successful add
 * opens the cart drawer, like hodl's mini-cart.
 */
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
  const { setOpen } = useCartUI();
  const [added, setAdded] = useState(false);
  const out = product.stock <= 0;
  return (
    <button
      type="button"
      disabled={out}
      onClick={() => {
        addToCart(product, quantity, variant);
        setAdded(true);
        setTimeout(() => {
          setAdded(false);
          setOpen(true);
        }, 350);
      }}
      className={`btn ${out ? "cursor-not-allowed bg-surface-2 text-muted-2 shadow-none" : "btn--primary"} ${className}`}
    >
      {out ? "Out of Stock" : added ? "Added ✓" : label}
    </button>
  );
}

/** Circular "+" quick-add (the card footer's action): one tap adds
 *  a single unit and pops the cart drawer. */
export function QuickAddButton({ product }: { product: CatalogProduct }) {
  const { addToCart } = useShop();
  const { setOpen } = useCartUI();
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
        setTimeout(() => {
          setAdded(false);
          setOpen(true);
        }, 350);
      }}
      className="plus-btn"
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
      className={`wish-btn ${active ? "is-on" : ""} ${className}`}
    >
      <span aria-hidden>{active ? "♥" : "♡"}</span>
    </button>
  );
}
