"use client";

import { useEffect, useState } from "react";
import { apiCall, formatMoney, type TrackedOrder } from "@/lib/api";

const inputCls =
  "w-full rounded-xl border border-line/80 bg-ink-2/80 px-3.5 py-2.5 text-sm text-cream placeholder:text-muted-2";
const labelCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-2";

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
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-cream">Track Your Order</h1>
      <p className="mt-2 text-muted">
        Enter the order number from your confirmation and the email you ordered with — no account needed.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-3xl border border-line/70 bg-surface p-6 sm:grid-cols-2">
        <div>
          <label htmlFor="to-number" className={labelCls}>Order number *</label>
          <input id="to-number" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ORD-260124-1234" className={inputCls} />
        </div>
        <div>
          <label htmlFor="to-email" className={labelCls}>Email *</label>
          <input id="to-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
        </div>
        <button type="submit" disabled={busy} className="rounded-full bg-primary px-8 py-3 font-bold text-white shadow-glow transition hover:bg-primary-dark active:scale-[0.98] disabled:opacity-60 sm:col-span-2 sm:w-fit">
          {busy ? "Looking up…" : "Track Order"}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-primary" role="alert">{error}</p>}

      {order && (
        <section className="mt-6 rounded-3xl border border-line/70 bg-surface p-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-cream">{order.orderNumber}</h2>
            <span className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-glow">
              {order.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Placed {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            {order.city ? ` · Delivering to ${order.city}${order.country ? `, ${order.country}` : ""}` : ""}
          </p>

          <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="text-muted">{item.name} <span className="text-muted-2">× {item.quantity}</span></span>
                <span className="font-medium text-cream">{formatMoney(item.price * item.quantity, currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="text-cream">{formatMoney(order.subtotal, currency)}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="text-emerald-400">−{formatMoney(order.discount, currency)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="text-cream">{order.shippingCost === 0 ? "Free" : formatMoney(order.shippingCost, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Payment</dt><dd className="text-cream">{order.paymentMethod} — {order.paymentStatus}</dd></div>
            <div className="flex justify-between text-base"><dt className="font-bold text-cream">Total</dt><dd className="font-extrabold text-cream">{formatMoney(order.total, currency)}</dd></div>
          </dl>

          {(order.shipment.trackingNumber || order.shipment.shippedAt) && (
            <div className="mt-4 rounded-2xl bg-ink-2/80 p-5 text-sm">
              <p className="font-semibold text-cream">Shipment</p>
              {order.shipment.courierName && <p className="mt-1 text-muted">Courier: {order.shipment.courierName}</p>}
              {order.shipment.trackingNumber && <p className="text-muted">Tracking number: {order.shipment.trackingNumber}</p>}
              {order.shipment.shippedAt && (
                <p className="text-muted">Shipped {new Date(order.shipment.shippedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
              )}
              {order.shipment.deliveredAt && (
                <p className="text-muted">Delivered {new Date(order.shipment.deliveredAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
              )}
              {order.shipment.trackingUrl && (
                <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-primary transition hover:text-cream">
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
