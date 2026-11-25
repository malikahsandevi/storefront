"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiCall, formatMoney, type ShippingOptionSet, type StoreConfig } from "@/lib/api";
import { useShop } from "@/lib/store";
import { IconCheck } from "@/components/icons";

/**
 * The cart page, laid out like the reference store's cart: a
 * back link and display title, the free-shipping progress note
 * above the list (shown only when the store has configured a
 * method with a free-shipping threshold), plain item rows with
 * hairline dividers, and the "Your Cart Worth" panel — the
 * carted items' own price calculation (quantity × unit price
 * per line) and the total. Coupons are handled at checkout
 * only; shipping is likewise computed at checkout.
 */
export default function CartPage() {
  const { cart, updateQty, removeLine, cartSubtotal } = useShop();
  const [currency, setCurrency] = useState("USD");
  const [paymentNames, setPaymentNames] = useState<string[]>([]);
  const [shipping, setShipping] = useState<ShippingOptionSet | null>(null);

  useEffect(() => {
    apiCall<StoreConfig>("GET", "/api/storefront/config")
      .then((config) => {
        setCurrency(config.currency || "USD");
        setPaymentNames((config.paymentMethods || []).map((m) => m.name).filter(Boolean));
      })
      .catch(() => {});
    apiCall<ShippingOptionSet>("GET", "/api/storefront/shipping-options")
      .then(setShipping)
      .catch(() => {});
  }, []);

  const freeMethod = shipping?.methods.find((m) => m.freeAbove && m.freeAbove > 0);
  const freeRemaining = freeMethod ? Math.max(0, (freeMethod.freeAbove || 0) - cartSubtotal) : 0;
  const freePct = freeMethod ? Math.min(100, (cartSubtotal / (freeMethod.freeAbove || 1)) * 100) : 0;

  if (cart.length === 0) {
    return (
      <div className="wrap py-16 text-center">
        <h1 className="h1-page">Your Cart</h1>
        <p className="mt-4 text-muted">Your cart is empty.</p>
        <Link href="/shop" className="btn btn--primary mt-7">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap py-10 md:py-14">
      <Link href="/shop" className="vlink">← Back to shop</Link>
      <h1 className="h1-page mt-5">Your Cart</h1>

      {freeMethod && (
        <div className="panel panel--pad mt-9" role="status">
          <p className="text-sm text-muted">
            {freeRemaining > 0 ? (
              <>
                You are <strong className="text-cream">{formatMoney(freeRemaining, currency)}</strong>{" "}
                away from free shipping with {freeMethod.name}.
              </>
            ) : (
              <>
                Your order qualifies for <strong className="text-cream">free shipping</strong> with{" "}
                {freeMethod.name}.
              </>
            )}
          </p>
          <div className="ship-progress mt-3">
            <span style={{ transform: `scaleX(${freePct / 100})` }} />
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <ul className="divide-y divide-line">
          {cart.map((line) => (
            <li key={`${line.productId}-${line.variant || ""}`} className="flex gap-5 py-6 first:pt-0">
              <Link href={`/product/${line.slug}`} className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-surface">
                {line.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.image} alt={line.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-display text-2xl text-line">
                    {line.name.charAt(0)}
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/product/${line.slug}`} className="font-display text-lg font-medium leading-snug text-cream transition hover:text-primary">
                    {line.name}
                  </Link>
                  <span className="font-display text-lg font-semibold text-cream">
                    {formatMoney(line.price * line.quantity, currency)}
                  </span>
                </div>
                {line.variant && <p className="mt-0.5 text-xs text-muted">{line.variant}</p>}
                <p className="mt-0.5 text-sm text-muted">{formatMoney(line.price, currency)} each</p>
                <div className="mt-3.5 flex flex-wrap items-center gap-4">
                  <div className="stepper">
                    <button type="button" aria-label="Decrease quantity" onClick={() => updateQty(line.productId, line.variant, line.quantity - 1)}>
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => updateQty(line.productId, line.variant, line.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.productId, line.variant)}
                    className="text-xs font-semibold text-muted-2 transition hover:text-primary"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="panel panel--pad lg:sticky lg:top-[120px]">
          <h2 className="font-display text-[22px] font-normal text-cream">Your Cart Worth</h2>
          <div className="mt-5 border-t border-line">
            {cart.map((line) => (
              <div
                key={`${line.productId}-${line.variant || ""}`}
                className="flex items-baseline justify-between gap-3 border-b border-line py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-cream">{line.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {line.quantity} × {formatMoney(line.price, currency)}
                  </p>
                </div>
                <span className="shrink-0 font-display text-[15px] font-semibold text-cream">
                  {formatMoney(line.price * line.quantity, currency)}
                </span>
              </div>
            ))}
            <div className="flex items-baseline justify-between pt-4">
              <span className="font-display text-base font-medium text-cream">Total</span>
              <span className="font-display text-xl font-semibold text-cream">
                {formatMoney(cartSubtotal, currency)}
              </span>
            </div>
          </div>
          <Link href="/checkout" className="btn btn--primary btn--block mt-6">
            Proceed to Checkout
          </Link>
          <ul className="ticks mt-6">
            <li>
              <IconCheck /> Order tracking on every purchase
            </li>
            <li>
              <IconCheck /> Transparent pricing, confirmed at checkout
            </li>
          </ul>
          {paymentNames.length > 0 && (
            <p className="mt-5 text-xs text-muted-2">Pay with {paymentNames.join(" · ")}</p>
          )}
          <Link href="/shop" className="mt-4 block text-center text-sm text-muted transition hover:text-cream">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
