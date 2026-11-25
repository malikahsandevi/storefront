"use client";

import { useEffect, useState } from "react";
import { apiCall, formatMoney, type TrackedOrder } from "@/lib/api";

/** Order tracking: the previous build's lookup (order number +
 *  email, both must match) and result content, in the vault panel
 *  style with the status as a solid accent pill. */
export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    apiCall<{ currency: string }>("GET", "/api/storefront/config")
      .then((config) => setCurrency(config.currency || "USD"))
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOrder(null);
    try {
      const result = await apiCall<TrackedOrder>("POST", "/api/storefront/track", {
        orderNumber: orderNumber.trim(),
        email: email.trim(),
      });
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
        Enter the order number from your confirmation and the email you ordered with — no account needed.
      </p>
      <form onSubmit={submit} className="panel panel--pad mt-9 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="to-number" className="flabel">Order number *</label>
          <input id="to-number" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ORD-260124-1234" className="input" />
        </div>
        <div>
          <label htmlFor="to-email" className="flabel">Email *</label>
          <input id="to-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" />
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
            <div>
              <dt>Payment</dt>
              <dd>{order.paymentMethod} — {order.paymentStatus}</dd>
            </div>
            <div className="total">
              <dt>Total</dt>
              <dd>{formatMoney(order.total, currency)}</dd>
            </div>
          </dl>

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
    </div>
  );
}
