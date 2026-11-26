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
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import CustomSelect from "@/components/CustomSelect";

/**
 * Checkout. PRESENTATION ONLY in this rebuild — every state,
 * effect, payload and message is the previous page's logic
 * unchanged: config + shipping choices from the backend, the
 * profile prefill for signed-in customers, the debounced server
 * quote (totals always come from the server), and order placement
 * through the existing createOrder flow. (Stripe round: when the
 * shop's Stripe entry is configured and the Stripe method is picked,
 * placement is followed by a redirect to Stripe's hosted page, and
 * the ?payment= return landing re-reads the order's real status.)
 */
export default function CheckoutPage() {
  const { cart, user, clearCart, ready, openAuth } = useShop();
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
  const [payError, setPayError] = useState("");
  // Return landing from Stripe's hosted page (?payment=success|
  // cancelled&orderId=…): the order's real state is re-read from the
  // backend — this page never declares a payment "Paid" itself.
  // Embedded card payment (Ahsan, 2026-11-26: card details are
  // taken HERE, never by redirecting to Stripe's hosted page):
  // after a Stripe order is placed, the backend opens a
  // PaymentIntent and this page mounts Stripe's Payment Element
  // in place, confirms in place, and hands off to the same
  // truthful status re-read the return landing uses.
  const [payStep, setPayStep] = useState<{ order: PlacedOrder; clientSecret: string } | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [payReady, setPayReady] = useState(false);
  const [payMessage, setPayMessage] = useState("");
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const payMountRef = useRef<HTMLDivElement | null>(null);
  const [landing, setLanding] = useState<{ kind: "success" | "cancelled"; orderId: string; orderNumber: string } | null>(null);
  const [landingOrder, setLandingOrder] = useState<{ orderNumber: string; status: string; paymentStatus: string; paymentMethod: string; total: number } | null>(null);
  const [landingDone, setLandingDone] = useState(false);
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currency = config?.currency || "USD";
  // Online card payment is live only when the shop's Stripe entry is
  // configured (the config flag) AND the shopper picked that method.
  const stripeOnline = Boolean(config?.stripePayAvailable) && paymentMethod.trim().toLowerCase() === "stripe";
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

  // Stripe return landing: Stripe sends the browser back here with
  // ?payment=success|cancelled&orderId=…&order=… after its hosted page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const orderId = params.get("orderId");
    if ((payment === "success" || payment === "cancelled") && orderId) {
      setLanding({ kind: payment, orderId, orderNumber: params.get("order") || "" });
    }
  }, []);

  // Read the returned order's real state through the customer's
  // account order view. There is NO guest read any more: order
  // lookups are account-only (tracking went login-only, Ahsan
  // 2026-11-26), so a landing whose session is gone shows the
  // order number plus a sign-in prompt for the status — and the
  // moment the visitor signs in, this effect re-runs and the real
  // status lands. The read waits for the session check to settle
  // (a returning customer's stored session validates a beat after
  // the page loads). One delayed re-read on the success landing,
  // because the webhook may land a moment later — the status
  // shown is always the backend's, never a guess.
  useEffect(() => {
    if (!landing || !ready) return;
    let stale = false;
    const readStatus = async () => {
      if (!user) return null;
      return apiCall<{ orderNumber: string; status: string; paymentStatus: string; paymentMethod: string; total: number }>(
        "GET", `/api/storefront/me/orders/${landing.orderId}`, undefined, user.token,
      );
    };
    (async () => {
      let data: Awaited<ReturnType<typeof readStatus>> = null;
      try { data = await readStatus(); } catch { data = null; }
      if (stale) return;
      if (data) setLandingOrder(data);
      setLandingDone(true);
      if (landing.kind === "success" && data && data.paymentStatus !== "paid") {
        setTimeout(async () => {
          if (stale) return;
          try {
            const again = await readStatus();
            if (again && !stale) setLandingOrder(again);
          } catch { /* keep the first read */ }
        }, 3000);
      }
    })();
    return () => { stale = true; };
  }, [landing, user, ready]);

  // Mount the Payment Element when the payment step opens:
  // Stripe.js loads from js.stripe.com with the shop's
  // publishable key (served by the store config — public by
  // design), and the element is styled from the site's own
  // tokens as far as Stripe's appearance API allows. If the
  // library cannot load, the step degrades to the honest
  // placed-but-unpaid line instead of a dead box.
  useEffect(() => {
    if (!payStep || !config?.stripePublishableKey) return;
    let cancelled = false;
    (async () => {
      try {
        const { loadStripe } = await import("@stripe/stripe-js");
        const stripe = await loadStripe(config.stripePublishableKey);
        if (!stripe || cancelled || !payMountRef.current) throw new Error("stripe-load");
        const isDark = document.documentElement.getAttribute("data-mode") === "dark";
        const styles = getComputedStyle(document.documentElement);
        const elements = stripe.elements({
          clientSecret: payStep.clientSecret,
          appearance: {
            theme: isDark ? "night" : "stripe",
            variables: {
              colorPrimary: styles.getPropertyValue("--sf-primary").trim() || "#f97316",
              fontFamily: getComputedStyle(document.body).fontFamily,
              borderRadius: "14px",
            },
          },
        });
        const paymentElement = elements.create("payment");
        paymentElement.on("ready", () => { if (!cancelled) setPayReady(true); });
        paymentElement.mount(payMountRef.current);
        stripeRef.current = stripe;
        elementsRef.current = elements;
      } catch {
        if (!cancelled) {
          setPayMessage("Card payment could not be loaded — your order is placed but unpaid. You can pay later from order tracking or your account.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [payStep, config?.stripePublishableKey]);

  // Account details land in the form AUTOMATICALLY (Ahsan,
  // 2026-11-26) — with merge semantics, never overwrite: when a
  // user becomes known (already signed in on arrival, or signing
  // in from the popup mid-checkout), each field takes the
  // account's value ONLY while it is still empty. Anything the
  // guest already typed stays exactly as typed; the page never
  // remounts across the popup, so the cart and every choice
  // survive untouched. The address follows the same rule per
  // field, except the country: a completely untouched address
  // takes the default saved address wholesale (country
  // included); a half-typed one keeps its country line as-is.
  const mergedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || mergedForRef.current === user._id) return;
    mergedForRef.current = user._id;
    setFirstName((v) => v || user.firstName || "");
    setLastName((v) => v || user.lastName || "");
    setEmail((v) => v || user.email || "");
    const addressUntouched = !street && !city && !state && !zipCode;
    apiCall<CustomerProfile>("GET", "/api/storefront/me", undefined, user.token)
      .then((data) => {
        setProfile(data);
        setPhone((v) => v || data.phone || "");
        const address = data.addresses.find((a) => a.isDefault) || data.addresses[0];
        if (address) {
          setStreet((v) => v || address.street);
          setCity((v) => v || address.city);
          setState((v) => v || address.state);
          setZipCode((v) => v || address.zipCode);
          if (addressUntouched) setCountry(address.country);
        }
      })
      .catch(() => {});
    // The address snapshot is read from the render in which the
    // user landed — that is the merge moment by construction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Login first (Ahsan, 2026-11-26): a logged-out arrival at
  // checkout gets the sign-in popup ONCE, in login mode — but
  // only after the session check has settled (a signed-in
  // visitor never sees the flash), never over a Stripe return
  // landing, and never for an empty cart. The popup stays
  // closable: guest checkout is a designed feature of this
  // store, and closing it simply continues as guest.
  const loginPromptedRef = useRef(false);
  useEffect(() => {
    if (!ready || user || loginPromptedRef.current) return;
    if (items.length === 0) return;
    if (new URLSearchParams(window.location.search).has("payment")) return;
    loginPromptedRef.current = true;
    openAuth("login");
  }, [ready, user, items.length, openAuth]);

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

  // Confirm the card payment IN PLACE. A decline comes back as
  // Stripe's own human message, shown right here — the order
  // stays placed + unpaid and the element stays editable for a
  // retry. A success hands off to the return-landing state,
  // whose re-read (immediate + one delayed) shows "Payment
  // confirmed" ONLY when the backend — via the webhook — says
  // the order is paid. This page never declares Paid itself.
  const confirmPay = async () => {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements || !payStep) return;
    setPayBusy(true);
    setPayMessage("");
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/checkout?payment=success&orderId=${payStep.order._id}&order=${encodeURIComponent(payStep.order.orderNumber)}`,
        },
      });
      if (error) {
        setPayMessage(error.message || "Your card could not be charged — please check the details and try again.");
        setPayBusy(false);
        return;
      }
      setLanding({ kind: "success", orderId: payStep.order._id, orderNumber: payStep.order.orderNumber });
    } catch {
      setPayMessage("Something went wrong while confirming your payment — your order is placed; check its status from order tracking before paying again.");
      setPayBusy(false);
    }
  };

  if (landing) {
    const shownNumber = landingOrder?.orderNumber || landing.orderNumber;
    const paid = landingOrder?.paymentStatus === "paid";
    return (
      <div className="wrap py-16">
        <div className="mx-auto max-w-xl text-center">
          <p aria-hidden className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-4xl text-primary ring-1 ring-primary/40">{landing.kind === "cancelled" ? "!" : "✓"}</p>
          <h1 className="h1-page mt-6">
            {landing.kind === "cancelled" ? "Payment not completed" : paid ? "Payment confirmed — thank you!" : "Order placed — thank you!"}
          </h1>
          {landing.kind === "cancelled" ? (
            <p className="mt-4 text-muted">
              Your payment was not completed{shownNumber ? <> for order <span className="font-bold text-cream">{shownNumber}</span></> : ""} — the order is placed but unpaid.
            </p>
          ) : (
            <p className="mt-4 text-muted">
              {shownNumber ? <>Your order number is <span className="font-bold text-cream">{shownNumber}</span>. </> : ""}
              {paid ? "Your payment has been received." : "Your payment status is shown below, exactly as the store has it."}
            </p>
          )}
          {landingOrder ? (
            <dl className="panel mx-auto mt-7 max-w-sm space-y-2.5 px-6 py-6 text-left text-sm">
              <div className="flex justify-between"><dt className="text-muted">Total</dt><dd className="font-bold text-cream">{formatMoney(landingOrder.total, currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Payment</dt><dd className="text-cream">{landingOrder.paymentMethod} ({landingOrder.paymentStatus})</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Status</dt><dd className="text-cream">{landingOrder.status}</dd></div>
            </dl>
          ) : !user && ready ? (
            <div className="mt-4">
              <p className="text-sm text-muted">Sign in to see the latest status of your order.</p>
              <button type="button" className="btn btn--ghost btn--sm mt-4" onClick={() => openAuth("login")}>
                Sign In
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">{landingDone ? "Use order tracking to see the latest status of your order." : "Loading your order…"}</p>
          )}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/track-order" className="btn btn--primary">
              Track Order
            </Link>
            {user && (
              <Link href="/account/orders" className="btn btn--ghost">
                My Orders
              </Link>
            )}
            <Link href="/shop" className="btn btn--ghost">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (ready && cart.length === 0 && !placed) {
    return (
      <div className="wrap py-16 text-center">
        <h1 className="h1-page">Checkout</h1>
        <p className="mt-4 text-muted">Your cart is empty — add something first.</p>
        <Link href="/shop" className="btn btn--primary mt-7">
          Go to Shop
        </Link>
      </div>
    );
  }

  if (payStep) {
    return (
      <div className="wrap py-16">
        <div className="mx-auto max-w-xl text-center">
          <p aria-hidden className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-9 w-9" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="M3 10h18" />
            </svg>
          </p>
          <h1 className="h1-page mt-6">Pay for your order</h1>
          <p className="mt-4 text-muted">
            Order <span className="font-bold text-cream">{payStep.order.orderNumber}</span> is placed —{" "}
            <span className="font-bold text-cream">{formatMoney(payStep.order.total, currency)}</span> is left to pay.
            Enter your card details below: they go straight to Stripe, and this store never sees or stores them.
          </p>
          <div className="panel panel--pad mt-7 text-left">
            <div ref={payMountRef} />
            {payMessage && <p className="mt-4 text-sm text-primary" role="alert">{payMessage}</p>}
            <button
              type="button"
              onClick={confirmPay}
              disabled={!payReady || payBusy}
              className="btn btn--primary btn--block mt-5 disabled:opacity-60"
            >
              {payBusy ? "Confirming…" : `Pay ${formatMoney(payStep.order.total, currency)}`}
            </button>
          </div>
          <p className="mt-5 text-sm text-muted">
            Your order stays placed either way — if you leave this page, you can pay later from order tracking or your account.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/track-order" className="btn btn--ghost">
              Track Order
            </Link>
            {user && (
              <Link href="/account/orders" className="btn btn--ghost">
                My Orders
              </Link>
            )}
            <Link href="/shop" className="btn btn--ghost">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="wrap py-16">
        <div className="mx-auto max-w-xl text-center">
          <p aria-hidden className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-4xl text-primary ring-1 ring-primary/40">✓</p>
          <h1 className="h1-page mt-6">Order placed — thank you!</h1>
          <p className="mt-4 text-muted">
            Your order number is <span className="font-bold text-cream">{placed.orderNumber}</span>.
            Keep it safe — you can track your order any time: sign in and enter this number.
          </p>
          <dl className="panel mx-auto mt-7 max-w-sm space-y-2.5 px-6 py-6 text-left text-sm">
            <div className="flex justify-between"><dt className="text-muted">Total</dt><dd className="font-bold text-cream">{formatMoney(placed.total, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Payment</dt><dd className="text-cream">{placed.paymentMethod} ({placed.paymentStatus})</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Status</dt><dd className="text-cream">{placed.status}</dd></div>
          </dl>
          {payError && <p className="mt-4 text-sm text-primary" role="alert">{payError}</p>}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/track-order" className="btn btn--primary">
              Track Order
            </Link>
            {user && (
              <Link href="/account/orders" className="btn btn--ghost">
                My Orders
              </Link>
            )}
            <Link href="/shop" className="btn btn--ghost">
              Continue Shopping
            </Link>
          </div>
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
        // The contact block ALWAYS goes with the order, signed in or
        // not: the backend trusts a valid session token and ignores
        // the block, but if it no longer accepts the browser's saved
        // session (expired, secret rotated, account changed) it falls
        // back to these details — without them it would refuse a
        // visibly filled form with "name and email are required".
        customer: { firstName, lastName, email, phone },
        shippingAddress: { street, city, state, zipCode, country },
        items,
        paymentMethod,
        couponCode: couponCode.trim() || undefined,
        shippingMethodId: methodId || undefined,
        deliveryOptionId: optionId || undefined,
      }, user?.token);
      if (stripeOnline && !config?.stripePublishableKey) {
        // Gateway on but no publishable key served — the element
        // cannot mount, so skip straight to the honest line.
        setPayError("Online payment could not be started — your order is placed but unpaid.");
      } else if (stripeOnline) {
        // The embedded flow hands off to the same landing
        // machinery a hosted return would; its status re-read
        // runs through the account (order lookups are
        // account-only now), so nothing needs stashing.
        try {
          const intent = await apiCall<{ clientSecret: string }>(
            "POST", `/api/storefront/orders/${order._id}/stripe-intent`, {}, user?.token,
          );
          setPlaced(order);
          setPayStep({ order, clientSecret: intent.clientSecret });
          clearCart();
          return;
        } catch {
          // The order IS placed; only the payment could not start.
          setPayError("Online payment could not be started — your order is placed but unpaid.");
        }
      }
      setPlaced(order);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place your order.");
    } finally {
      setPlacing(false);
    }
  };

  const stepChip = (n: number) => (
    <span
      aria-hidden
      className="mr-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold text-white shadow-glow [background:var(--grad-btn)]"
    >
      {n}
    </span>
  );

  return (
    <div className="wrap py-10 md:py-14">
      <h1 className="h1-page">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-6">
          <section className="panel panel--pad" aria-labelledby="contact-h">
            <h2 id="contact-h" className="flex items-center font-display text-xl font-medium text-cream">
              {stepChip(1)}Contact
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="co-first" className="flabel">First name *</label>
                <input id="co-first" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="co-last" className="flabel">Last name</label>
                <input id="co-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" autoComplete="family-name" />
              </div>
              <div>
                <label htmlFor="co-email" className="flabel">Email *</label>
                <input id="co-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" readOnly={!!user} />
              </div>
              <div>
                <label htmlFor="co-phone" className="flabel">Phone</label>
                <input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" autoComplete="tel" />
              </div>
            </div>
            {profile && profile.addresses.length > 0 && (
              <div className="mt-4">
                <label htmlFor="co-saved" className="flabel">Saved addresses</label>
                <CustomSelect
                  id="co-saved"
                  defaultValue=""
                  ariaLabel="Saved addresses"
                  options={[
                    { value: "", label: "Choose a saved address…" },
                    ...profile.addresses.map((address, i) => ({
                      value: String(i),
                      label: `${address.street}, ${address.city}`,
                    })),
                  ]}
                  onChange={(v) => {
                    const address = profile.addresses[Number(v)];
                    if (!address) return;
                    setStreet(address.street);
                    setCity(address.city);
                    setState(address.state);
                    setZipCode(address.zipCode);
                    setCountry(address.country);
                  }}
                />
              </div>
            )}
          </section>

          <section className="panel panel--pad" aria-labelledby="ship-h">
            <h2 id="ship-h" className="flex items-center font-display text-xl font-medium text-cream">
              {stepChip(2)}Shipping Address
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="co-street" className="flabel">Street address *</label>
                <input id="co-street" required value={street} onChange={(e) => setStreet(e.target.value)} className="input" autoComplete="street-address" />
              </div>
              <div>
                <label htmlFor="co-city" className="flabel">City *</label>
                <input id="co-city" required value={city} onChange={(e) => setCity(e.target.value)} className="input" autoComplete="address-level2" />
              </div>
              <div>
                <label htmlFor="co-state" className="flabel">State / Province *</label>
                <input id="co-state" required value={state} onChange={(e) => setState(e.target.value)} className="input" autoComplete="address-level1" />
              </div>
              <div>
                <label htmlFor="co-zip" className="flabel">ZIP / Postal code *</label>
                <input id="co-zip" required value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="input" autoComplete="postal-code" />
              </div>
              <div>
                <label htmlFor="co-country" className="flabel">Country *</label>
                <input id="co-country" required value={country} onChange={(e) => setCountry(e.target.value)} className="input" autoComplete="country-name" />
              </div>
            </div>
          </section>

          {shipping && shipping.configured && (
            <section className="panel panel--pad" aria-labelledby="delivery-h">
              <h2 id="delivery-h" className="flex items-center font-display text-xl font-medium text-cream">
                {stepChip(3)}Delivery
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="co-method" className="flabel">Shipping method</label>
                  <CustomSelect
                    id="co-method"
                    value={methodId}
                    onChange={(v) => setMethodId(v)}
                    ariaLabel="Shipping method"
                    options={shipping.methods.map((method) => ({
                      value: method.id,
                      label: `${method.name} — ${method.freeAbove ? `free over ${formatMoney(method.freeAbove, currency)}, else ` : ""}${formatMoney(method.charge, currency)}${method.estimatedDays ? ` · ${method.estimatedDays}` : ""}`,
                    }))}
                  />
                </div>
                <div>
                  <label htmlFor="co-option" className="flabel">Delivery option</label>
                  <CustomSelect
                    id="co-option"
                    value={optionId}
                    onChange={(v) => setOptionId(v)}
                    ariaLabel="Delivery option"
                    options={shipping.deliveryOptions.map((option) => ({ value: option.id, label: option.name }))}
                  />
                </div>
              </div>
            </section>
          )}

          <section className="panel panel--pad" aria-labelledby="pay-h">
            <h2 id="pay-h" className="flex items-center font-display text-xl font-medium text-cream">
              {stepChip(shipping && shipping.configured ? 4 : 3)}Payment
            </h2>
            <div className="mt-4 space-y-2.5">
              {(config?.paymentMethods.length ? config.paymentMethods : [{ name: "Cash on Delivery", description: "" }]).map((method) => (
                <label key={method.name} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-ink-2 px-4 py-3.5 text-sm transition hover:border-primary/70 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                  <input
                    type="radio"
                    name="payment"
                    value={method.name}
                    checked={paymentMethod === method.name}
                    onChange={() => setPaymentMethod(method.name)}
                    className="rdo"
                  />
                  <span>
                    <span className="font-semibold text-cream">{method.name}</span>
                    {method.description && <span className="block text-xs text-muted">{method.description}</span>}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3.5 text-xs text-muted-2">
              {stripeOnline
                ? "You will enter your card details right here on this page after placing your order — nothing is charged until you confirm the payment."
                : "Online payment methods are confirmed by the store after your order is placed; cash on delivery is paid when your order arrives."}
            </p>
          </section>
        </div>

        <aside className="panel panel--pad lg:sticky lg:top-[120px]">
          <h2 className="font-display text-xl font-medium text-cream">Order Summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {cart.map((line) => (
              <li key={`${line.productId}-${line.variant || ""}`} className="flex justify-between gap-3">
                <span className="text-muted">
                  {line.name} <span className="text-muted-2">× {line.quantity}</span>
                </span>
                <span className="font-medium text-cream">{formatMoney(line.price * line.quantity, currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <label htmlFor="co-coupon" className="flabel">Coupon code</label>
            <input id="co-coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter code" className="input" />
          </div>
          {quoteError && <p className="mt-3 text-sm text-primary" role="alert">{quoteError}</p>}
          <dl className="ledger mt-5">
            <div>
              <dt>Subtotal</dt>
              <dd>{quote ? formatMoney(quote.subtotal, currency) : "…"}</dd>
            </div>
            {quote && quote.discount > 0 && (
              <div>
                <dt>Discount{quote.coupon ? ` (${quote.coupon.code})` : ""}</dt>
                <dd className="text-emerald-400">−{formatMoney(quote.discount, currency)}</dd>
              </div>
            )}
            <div>
              <dt>Shipping{quote?.shipping ? ` — ${quote.shipping.methodName}` : ""}</dt>
              <dd>{quote ? (quote.shippingCost === 0 ? "Free" : formatMoney(quote.shippingCost, currency)) : "…"}</dd>
            </div>
            <div className="total">
              <dt>Total</dt>
              <dd>{quote ? formatMoney(quote.total, currency) : "…"}</dd>
            </div>
          </dl>
          {error && <p className="mt-3 text-sm text-primary" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={placing || !quote}
            className="btn btn--primary btn--block mt-6 disabled:opacity-60"
          >
            {placing ? "Placing order…" : stripeOnline ? "Place Order & Pay" : "Place Order"}
          </button>
          <button type="button" onClick={() => router.push("/cart")} className="mt-3.5 w-full text-center text-sm text-muted transition hover:text-cream">
            Back to cart
          </button>
        </aside>
      </form>
    </div>
  );
}
