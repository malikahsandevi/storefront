"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiCall, formatMoney, type Quote } from "@/lib/api";
import { useShop } from "@/lib/store";

export default function CartPage() {
  const { cart, updateQty, removeLine, cartSubtotal, user } = useShop();
  const [couponCode, setCouponCode] = useState("");
  const [applied, setApplied] = useState<Quote | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    apiCall<{ currency: string }>("GET", "/api/storefront/config")
      .then((config) => setCurrency(config.currency || "USD"))
      .catch(() => {});
  }, []);

  // The applied coupon re-validates whenever the cart changes.
  useEffect(() => {
    setApplied(null);
    setCouponMsg("");
  }, [cart]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setBusy(true);
    setCouponMsg("");
    try {
      const quote = await apiCall<Quote>("POST", "/api/storefront/quote", {
        items: cart.map((line) => ({ product: line.productId, quantity: line.quantity })),
        couponCode: couponCode.trim(),
        email: user?.email,
      }, user?.token);
      setApplied(quote);
      setCouponMsg(`Coupon applied — you save ${formatMoney(quote.discount, currency)}.`);
    } catch (error) {
      setApplied(null);
      setCouponMsg(error instanceof Error ? error.message : "That coupon could not be applied.");
    } finally {
      setBusy(false);
    }
  };

  const discount = applied?.discount || 0;
  const total = Math.max(0, cartSubtotal - discount);

  if (cart.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-3xl font-extrabold text-cream">Your Cart</h1>
        <p className="mt-3 text-muted">Your cart is empty.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-primary px-7 py-2.5 font-bold text-white transition hover:bg-primary-dark">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-extrabold text-cream">Your Cart</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {cart.map((line) => (
            <li key={`${line.productId}-${line.variant || ""}`} className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
              <Link href={`/product/${line.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-2">
                {line.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.image} alt={line.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-line">
                    {line.name.charAt(0)}
                  </span>
                )}
              </Link>
              <div className="flex flex-1 flex-col">
                <Link href={`/product/${line.slug}`} className="font-semibold text-cream transition hover:text-white">
                  {line.name}
                </Link>
                {line.variant && <p className="text-xs text-muted">{line.variant}</p>}
                <p className="mt-0.5 text-sm text-muted">{formatMoney(line.price, currency)} each</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-line">
                    <button type="button" aria-label="Decrease quantity" onClick={() => updateQty(line.productId, line.variant, line.quantity - 1)} className="px-3 py-1 text-lg text-muted transition hover:text-cream">−</button>
                    <span className="min-w-7 text-center text-sm font-semibold">{line.quantity}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => updateQty(line.productId, line.variant, line.quantity + 1)} className="px-3 py-1 text-lg text-muted transition hover:text-cream">+</button>
                  </div>
                  <span className="font-bold text-cream">{formatMoney(line.price * line.quantity, currency)}</span>
                </div>
                <button type="button" onClick={() => removeLine(line.productId, line.variant)} className="mt-1 self-start text-xs text-muted-2 transition hover:text-primary">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-32">
          <h2 className="font-bold text-cream">Order Summary</h2>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              applyCoupon();
            }}
          >
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon code"
              aria-label="Coupon code"
              className="min-w-0 flex-1 rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm text-cream placeholder:text-muted-2"
            />
            <button type="submit" disabled={busy} className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-60">
              {busy ? "…" : "Apply"}
            </button>
          </form>
          {couponMsg && <p className="mt-2 text-xs text-muted" role="status">{couponMsg}</p>}
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold text-cream">{formatMoney(cartSubtotal, currency)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Coupon discount</dt>
                <dd className="font-semibold text-emerald-400">−{formatMoney(discount, currency)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="text-muted">Calculated at checkout</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold text-cream">Estimated total</dt>
              <dd className="font-extrabold text-cream">{formatMoney(total, currency)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="mt-5 block rounded-full bg-primary py-3 text-center font-bold text-white transition hover:bg-primary-dark">
            Proceed to Checkout
          </Link>
          <Link href="/shop" className="mt-3 block text-center text-sm text-muted transition hover:text-cream">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
