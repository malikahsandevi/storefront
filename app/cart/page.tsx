"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiCall, formatMoney, type Quote, type StoreConfig } from "@/lib/api";
import { useShop } from "@/lib/store";

export default function CartPage() {
  const { cart, updateQty, removeLine, cartSubtotal, user } = useShop();
  const [couponCode, setCouponCode] = useState("");
  const [applied, setApplied] = useState<Quote | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [paymentNames, setPaymentNames] = useState<string[]>([]);

  useEffect(() => {
    apiCall<StoreConfig>("GET", "/api/storefront/config")
      .then((config) => {
        setCurrency(config.currency || "USD");
        setPaymentNames((config.paymentMethods || []).map((m) => m.name).filter(Boolean));
      })
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
        <h1 className="font-display text-4xl font-black uppercase tracking-tight text-cream">Your Cart</h1>
        <p className="mt-3 text-muted">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary-pill btn-shine mt-6 inline-block px-8 py-3.5 font-display text-[13px] font-bold uppercase tracking-[0.1em]">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="font-display text-5xl font-black uppercase tracking-tight text-cream sm:text-6xl">Your Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="vault-panel h-fit divide-y divide-line overflow-hidden">
          {cart.map((line) => (
            <li key={`${line.productId}-${line.variant || ""}`} className="flex gap-4 p-5">
              <Link href={`/product/${line.slug}`} className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-ink-2">
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
                  <div className="flex items-center rounded-full border border-line bg-ink-2">
                    <button type="button" aria-label="Decrease quantity" onClick={() => updateQty(line.productId, line.variant, line.quantity - 1)} className="px-3 py-1.5 text-lg text-muted transition hover:text-cream">−</button>
                    <span className="min-w-7 text-center text-sm font-semibold">{line.quantity}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => updateQty(line.productId, line.variant, line.quantity + 1)} className="px-3 py-1.5 text-lg text-muted transition hover:text-cream">+</button>
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

        <aside className="vault-panel h-fit p-6 lg:sticky lg:top-40">
          <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-cream">Order Summary</h2>
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
              className="min-w-0 flex-1 rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-sm text-cream placeholder:text-muted-2"
            />
            <button type="submit" disabled={busy} className="btn-ghost-pill px-5 py-2.5 text-sm font-semibold text-primary disabled:opacity-60">
              {busy ? "…" : "Apply"}
            </button>
          </form>
          {couponMsg && <p className="mt-2 text-xs text-muted" role="status">{couponMsg}</p>}
          <dl className="mt-4 divide-y divide-line text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold text-cream">{formatMoney(cartSubtotal, currency)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between py-2.5">
                <dt className="text-muted">Coupon discount</dt>
                <dd className="font-semibold text-emerald-400">−{formatMoney(discount, currency)}</dd>
              </div>
            )}
            <div className="flex justify-between py-2.5">
              <dt className="text-muted">Shipping</dt>
              <dd className="text-muted">Calculated at checkout</dd>
            </div>
            <div className="flex justify-between py-3 text-base">
              <dt className="font-bold text-cream">Estimated total</dt>
              <dd className="font-extrabold text-cream">{formatMoney(total, currency)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="btn-primary-pill btn-shine mt-5 block py-4 text-center font-display text-sm font-bold uppercase tracking-[0.1em]">
            Proceed to Checkout
          </Link>
          <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-muted">
            <li className="flex items-center gap-2">
              <span aria-hidden className="font-bold text-primary">✓</span> Order tracking on every purchase
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="font-bold text-primary">✓</span> Transparent pricing, confirmed at checkout
            </li>
          </ul>
          {paymentNames.length > 0 && (
            <p className="mt-4 text-xs text-muted-2">Pay with {paymentNames.join(" · ")}</p>
          )}
          <Link href="/shop" className="mt-4 block text-center text-sm text-muted transition hover:text-cream">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
