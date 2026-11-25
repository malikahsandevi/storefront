"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  apiCall,
  formatMoney,
  type CustomerProfile,
  type PlacedOrder,
  type Quote,
  type ShippingOptionSet,
  type StoreConfig,
} from "@/lib/api";
import { useShop } from "@/lib/store";

const inputCls =
  "w-full rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-sm text-cream placeholder:text-muted-2";
const labelCls = "mono-label mb-1.5 block text-muted-2";

export default function CheckoutPage() {
  const { cart, user, clearCart, ready } = useShop();
  const router = useRouter();

  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [shipping, setShipping] = useState<ShippingOptionSet | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("Pakistan");
  const [methodId, setMethodId] = useState("");
  const [optionId, setOptionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currency = config?.currency || "USD";
  const items = useMemo(
    () => cart.map((line) => ({ product: line.productId, quantity: line.quantity })),
    [cart],
  );

  // Load store config, shipping choices and (when signed in) the
  // account profile for prefill.
  useEffect(() => {
    apiCall<StoreConfig>("GET", "/api/storefront/config").then(setConfig).catch(() => {});
    apiCall<ShippingOptionSet>("GET", "/api/storefront/shipping-options")
      .then((options) => {
        setShipping(options);
        setMethodId(options.defaultMethodId || options.methods[0]?.id || "");
        setOptionId(options.defaultDeliveryOptionId || options.deliveryOptions[0]?.id || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setEmail(user.email || "");
    apiCall<CustomerProfile>("GET", "/api/storefront/me", undefined, user.token)
      .then((data) => {
        setProfile(data);
        setPhone(data.phone || "");
        const address = data.addresses.find((a) => a.isDefault) || data.addresses[0];
        if (address) {
          setStreet(address.street);
          setCity(address.city);
          setState(address.state);
          setZipCode(address.zipCode);
          setCountry(address.country);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (config && !paymentMethod) {
      setPaymentMethod(config.paymentMethods[0]?.name || "Cash on Delivery");
    }
  }, [config, paymentMethod]);

  // Live server quote — the numbers at checkout are the server's,
  // refreshed whenever the cart or delivery choices change.
  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(() => {
      apiCall<Quote>("POST", "/api/storefront/quote", {
        items,
        city,
        shippingMethodId: methodId || undefined,
        deliveryOptionId: optionId || undefined,
        couponCode: couponCode.trim() || undefined,
        email: email || user?.email,
      }, user?.token)
        .then((result) => {
          setQuote(result);
          setQuoteError("");
        })
        .catch((err) => {
          setQuote(null);
          setQuoteError(err instanceof Error ? err.message : "Could not price this order.");
        });
    }, 450);
  }, [items, city, methodId, optionId, couponCode, email, user]);

  if (ready && cart.length === 0 && !placed) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-[clamp(2.1rem,4.5vw,3rem)] font-normal leading-[1.05] tracking-[-0.02em] text-cream">Checkout</h1>
        <p className="mt-3 text-muted">Your cart is empty — add something first.</p>
        <Link href="/shop" className="btn-primary-pill btn-shine mt-6 inline-block px-8 py-4 font-display text-[13px] font-semibold uppercase tracking-[0.08em]">
          Go to Shop
        </Link>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p aria-hidden className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-4xl text-primary ring-1 ring-primary/40">✓</p>
        <h1 className="mt-4 font-display text-[clamp(2.1rem,4.5vw,3rem)] font-normal leading-[1.05] tracking-[-0.02em] text-cream">Order placed — thank you!</h1>
        <p className="mt-3 text-muted">
          Your order number is <span className="font-bold text-cream">{placed.orderNumber}</span>.
          Keep it safe — you can track your order any time with this number and your email.
        </p>
        <dl className="vault-panel mx-auto mt-6 max-w-sm space-y-1 p-6 text-left text-sm">
          <div className="flex justify-between"><dt className="text-muted">Total</dt><dd className="font-bold text-cream">{formatMoney(placed.total, currency)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Payment</dt><dd className="text-cream">{placed.paymentMethod} ({placed.paymentStatus})</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Status</dt><dd className="text-cream">{placed.status}</dd></div>
        </dl>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/track-order" className="btn-primary-pill btn-shine px-6 py-4 font-display text-[13px] font-semibold uppercase tracking-[0.08em]">
            Track Order
          </Link>
          {user && (
            <Link href="/account/orders" className="btn-ghost-pill px-6 py-3 font-semibold text-muted hover:text-cream">
              My Orders
            </Link>
          )}
          <Link href="/shop" className="btn-ghost-pill px-6 py-3 font-semibold text-muted hover:text-cream">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    setError("");
    try {
      const order = await apiCall<PlacedOrder>("POST", "/api/storefront/orders", {
        ...(user
          ? {}
          : { customer: { firstName, lastName, email, phone } }),
        shippingAddress: { street, city, state, zipCode, country },
        items,
        paymentMethod,
        couponCode: couponCode.trim() || undefined,
        shippingMethodId: methodId || undefined,
        deliveryOptionId: optionId || undefined,
      }, user?.token);
      setPlaced(order);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place your order.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="py-8">
      <h1 className="font-display text-[clamp(2.5rem,5.5vw,4rem)] font-normal leading-[1.02] tracking-[-0.02em] text-cream">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="vault-panel p-6" aria-labelledby="contact-h">
            <h2 id="contact-h" className="flex items-center font-display text-xl font-medium tracking-[-0.01em] text-cream"><span aria-hidden className="grad-primary mr-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-extrabold text-white">1</span>Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="co-first" className={labelCls}>First name *</label>
                <input id="co-first" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="co-last" className={labelCls}>Last name</label>
                <input id="co-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} autoComplete="family-name" />
              </div>
              <div>
                <label htmlFor="co-email" className={labelCls}>Email *</label>
                <input id="co-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" readOnly={!!user} />
              </div>
              <div>
                <label htmlFor="co-phone" className={labelCls}>Phone</label>
                <input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} autoComplete="tel" />
              </div>
            </div>
            {profile && profile.addresses.length > 0 && (
              <div className="mt-4">
                <label htmlFor="co-saved" className={labelCls}>Saved addresses</label>
                <select
                  id="co-saved"
                  className={inputCls}
                  defaultValue=""
                  onChange={(e) => {
                    const address = profile.addresses[Number(e.target.value)];
                    if (!address) return;
                    setStreet(address.street);
                    setCity(address.city);
                    setState(address.state);
                    setZipCode(address.zipCode);
                    setCountry(address.country);
                  }}
                >
                  <option value="">Choose a saved address…</option>
                  {profile.addresses.map((address, i) => (
                    <option key={i} value={i}>
                      {address.street}, {address.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          <section className="vault-panel p-6" aria-labelledby="ship-h">
            <h2 id="ship-h" className="flex items-center font-display text-xl font-medium tracking-[-0.01em] text-cream"><span aria-hidden className="grad-primary mr-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-extrabold text-white">2</span>Shipping Address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="co-street" className={labelCls}>Street address *</label>
                <input id="co-street" required value={street} onChange={(e) => setStreet(e.target.value)} className={inputCls} autoComplete="street-address" />
              </div>
              <div>
                <label htmlFor="co-city" className={labelCls}>City *</label>
                <input id="co-city" required value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} autoComplete="address-level2" />
              </div>
              <div>
                <label htmlFor="co-state" className={labelCls}>State / Province *</label>
                <input id="co-state" required value={state} onChange={(e) => setState(e.target.value)} className={inputCls} autoComplete="address-level1" />
              </div>
              <div>
                <label htmlFor="co-zip" className={labelCls}>ZIP / Postal code *</label>
                <input id="co-zip" required value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={inputCls} autoComplete="postal-code" />
              </div>
              <div>
                <label htmlFor="co-country" className={labelCls}>Country *</label>
                <input id="co-country" required value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} autoComplete="country-name" />
              </div>
            </div>
          </section>

          {shipping && shipping.configured && (
            <section className="vault-panel p-6" aria-labelledby="delivery-h">
              <h2 id="delivery-h" className="flex items-center font-display text-xl font-medium tracking-[-0.01em] text-cream"><span aria-hidden className="grad-primary mr-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-extrabold text-white">3</span>Delivery</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="co-method" className={labelCls}>Shipping method</label>
                  <select id="co-method" value={methodId} onChange={(e) => setMethodId(e.target.value)} className={inputCls}>
                    {shipping.methods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name} — {method.freeAbove ? `free over ${formatMoney(method.freeAbove, currency)}, else ` : ""}{formatMoney(method.charge, currency)}{method.estimatedDays ? ` · ${method.estimatedDays}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="co-option" className={labelCls}>Delivery option</label>
                  <select id="co-option" value={optionId} onChange={(e) => setOptionId(e.target.value)} className={inputCls}>
                    {shipping.deliveryOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          )}

          <section className="vault-panel p-6" aria-labelledby="pay-h">
            <h2 id="pay-h" className="flex items-center font-display text-xl font-medium tracking-[-0.01em] text-cream"><span aria-hidden className="grad-primary mr-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-extrabold text-white">4</span>Payment</h2>
            <div className="mt-3 space-y-2">
              {(config?.paymentMethods.length ? config.paymentMethods : [{ name: "Cash on Delivery", description: "" }]).map((method) => (
                <label key={method.name} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-ink-2 px-4 py-3.5 text-sm transition hover:border-primary/70 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                  <input
                    type="radio"
                    name="payment"
                    value={method.name}
                    checked={paymentMethod === method.name}
                    onChange={() => setPaymentMethod(method.name)}
                    className="accent-primary"
                  />
                  <span>
                    <span className="font-semibold text-cream">{method.name}</span>
                    {method.description && <span className="block text-xs text-muted">{method.description}</span>}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-2">
              Online payment methods are confirmed by the store after your order is placed; cash on delivery is paid when your order arrives.
            </p>
          </section>
        </div>

        <aside className="vault-panel h-fit p-6 lg:sticky lg:top-40">
          <h2 className="font-display text-xl font-medium tracking-[-0.01em] text-cream">Order Summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cart.map((line) => (
              <li key={`${line.productId}-${line.variant || ""}`} className="flex justify-between gap-3">
                <span className="text-muted">
                  {line.name} <span className="text-muted-2">× {line.quantity}</span>
                </span>
                <span className="font-medium text-cream">{formatMoney(line.price * line.quantity, currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <label htmlFor="co-coupon" className={labelCls}>Coupon code</label>
            <input id="co-coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter code" className={inputCls} />
          </div>
          {quoteError && <p className="mt-3 text-sm text-primary" role="alert">{quoteError}</p>}
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold text-cream">{quote ? formatMoney(quote.subtotal, currency) : "…"}</dd>
            </div>
            {quote && quote.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Discount{quote.coupon ? ` (${quote.coupon.code})` : ""}</dt>
                <dd className="font-semibold text-emerald-400">−{formatMoney(quote.discount, currency)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping{quote?.shipping ? ` — ${quote.shipping.methodName}` : ""}</dt>
              <dd className="font-semibold text-cream">
                {quote ? (quote.shippingCost === 0 ? "Free" : formatMoney(quote.shippingCost, currency)) : "…"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold text-cream">Total</dt>
              <dd className="font-extrabold text-cream">{quote ? formatMoney(quote.total, currency) : "…"}</dd>
            </div>
          </dl>
          {error && <p className="mt-3 text-sm text-primary" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={placing || !quote}
            className="btn-primary-pill btn-shine mt-5 w-full py-4 font-display text-sm font-semibold uppercase tracking-[0.08em] disabled:opacity-60"
          >
            {placing ? "Placing order…" : "Place Order"}
          </button>
          <button type="button" onClick={() => router.push("/cart")} className="mt-3 w-full text-center text-sm text-muted transition hover:text-cream">
            Back to cart
          </button>
        </aside>
      </form>
    </div>
  );
}
