"use client";

import { useEffect, useRef, useState } from "react";
import { apiCall, formatMoney, type TrackedOrder } from "@/lib/api";
import { useShop } from "@/lib/store";
import PayNowButton from "@/components/PayNowButton";

/** Order tracking — account-only (Ahsan, 2026-11-26: "user must
 *  be login for this"). A guest never sees the form: the page
 *  shows the sign-in requirement and opens the auth popup once
 *  the session check has settled (checkout's login-first pattern;
 *  closable, but the form only ever renders for a signed-in
 *  customer). Signed in, the only thing typed is the order
 *  number — the email comes from the account and is shown locked,
 *  never as a free field; the backend checks the order belongs
 *  to the caller, so a stranger's number answers exactly like a
 *  nonexistent one. The result panel below is unchanged. */
export default function TrackOrderPage() {
  const { user, ready, openAuth } = useShop();
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    apiCall<{ currency: string }>("GET", "/api/storefront/config")
      .then((config) => setCurrency(config.currency || "USD"))
      .catch(() => {});
  }, []);

  // Login first: a logged-out arrival gets the sign-in popup ONCE,
  // but only after the session check has settled — a signed-in
  // visitor never sees the flash.
  const loginPromptedRef = useRef(false);
  useEffect(() => {
    if (!ready || user || loginPromptedRef.current) return;
    loginPromptedRef.current = true;
    openAuth("login");
  }, [ready, user, openAuth]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    setOrder(null);
    try {
      const result = await apiCall<TrackedOrder>(
        "POST", "/api/storefront/track",
        { orderNumber: orderNumber.trim() },
        user.token,
      );
      setOrder(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find that order.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap max-w-3xl py-12 md:py-16">
      <p className="kicker">
        <span className="kicker__idx">Orders</span>
        <span>Track your order</span>
        <span className="kicker__bar" aria-hidden />
      </p>
      <h1 className="h1-page mt-4">Track Your Order</h1>
      <p className="lead mt-4">
        Enter the order number from your confirmation — tracking runs on your account, so the email you ordered with comes from it automatically.
      </p>

      {!ready ? (
        <div className="panel panel--pad mt-9">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      ) : !user ? (
        <div className="panel panel--pad mt-9">
          <h2 className="font-display text-xl font-medium text-cream">Sign in to track your order</h2>
          <p className="mt-2 text-sm text-muted">
            Order tracking is tied to your account — sign in and your orders are looked up with your own email, so only you can see them.
          </p>
          <button type="button" className="btn btn--primary btn--sm mt-4" onClick={() => openAuth("login")}>
            Sign In
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={submit} className="panel panel--pad mt-9 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="to-number" className="flabel">Order number *</label>
              <input id="to-number" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ORD-260124-1234" className="input" />
            </div>
            <div>
              <label htmlFor="to-email" className="flabel">Email</label>
              <input id="to-email" value={user.email} readOnly aria-readonly="true" title="From your account" className="input opacity-70" />
            </div>
            <button type="submit" disabled={busy} className="btn btn--primary w-fit disabled:opacity-60 sm:col-span-2">
              {busy ? "Looking up…" : "Track Order"}
            </button>
          </form>
          {error && <p className="mt-4 text-sm text-primary" role="alert">{error}</p>}

          {order && (
            <section className="panel panel--pad mt-6" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-medium text-cream">{order.orderNumber}</h2>
                <span className="rounded-full bg-primary px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-wide text-white">
                  {order.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                Placed {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                {order.city ? ` · Delivering to ${order.city}${order.country ? `, ${order.country}` : ""}` : ""}
              </p>

              <ul className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="text-muted">{item.name} <span className="text-muted-2">× {item.quantity}</span></span>
                    <span className="font-medium text-cream">{formatMoney(item.price * item.quantity, currency)}</span>
                  </li>
                ))}
              </ul>
              <dl className="ledger mt-5">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(order.subtotal, currency)}</dd>
                </div>
                {order.discount > 0 && (
                  <div>
                    <dt>Discount</dt>
                    <dd className="text-emerald-400">−{formatMoney(order.discount, currency)}</dd>
                  </div>
                )}
                <div>
                  <dt>Shipping</dt>
                  <dd>{order.shippingCost === 0 ? "Free" : formatMoney(order.shippingCost, currency)}</dd>
                </div>
                {order.shippingMethodName && (
                  <div>
                    <dt>Delivery</dt>
                    <dd>{order.shippingMethodName}{order.deliveryOptionName ? ` · ${order.deliveryOptionName}` : ""}</dd>
                  </div>
                )}
                <div>
                  <dt>Payment</dt>
                  <dd>{order.paymentMethod} — {order.paymentStatus}</dd>
                </div>
                <div className="total">
                  <dt>Total</dt>
                  <dd>{formatMoney(order.total, currency)}</dd>
                </div>
              </dl>

              {order.canPayOnline && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-ink-2 p-5">
                  <p className="text-sm text-muted">
                    This order is placed but <span className="font-semibold text-cream">not yet paid</span>.
                  </p>
                  <PayNowButton orderId={order._id} token={user.token} />
                </div>
              )}

              {(order.shipment.trackingNumber || order.shipment.shippedAt) && (
                <div className="mt-6 rounded-2xl border border-line bg-ink-2 p-5 text-sm">
                  <p className="font-semibold text-cream">Shipment</p>
                  {order.shipment.courierName && <p className="mt-1.5 text-muted">Courier: {order.shipment.courierName}</p>}
                  {order.shipment.trackingNumber && <p className="text-muted">Tracking number: {order.shipment.trackingNumber}</p>}
                  {order.shipment.shippedAt && (
                    <p className="text-muted">Shipped {new Date(order.shipment.shippedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                  )}
                  {order.shipment.deliveredAt && (
                    <p className="text-muted">Delivered {new Date(order.shipment.deliveredAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                  )}
                  {order.shipment.trackingUrl && (
                    <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="vlink mt-2.5">
                      Track with the courier →
                    </a>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
