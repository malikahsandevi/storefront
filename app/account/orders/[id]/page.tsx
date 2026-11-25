"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall, formatMoney, type MyOrder } from "@/lib/api";
import { useShop } from "@/lib/store";

export default function MyOrderDetailPage() {
  const { user, ready } = useShop();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    apiCall<{ currency: string }>("GET", "/api/storefront/config")
      .then((config) => setCurrency(config.currency || "USD"))
      .catch(() => {});
    if (!user || !params?.id) return;
    apiCall<MyOrder>("GET", `/api/storefront/me/orders/${params.id}`, undefined, user.token)
      .then(setOrder)
      .catch(() => setError("This order could not be found."));
  }, [user, params]);

  if (!user) return <p className="py-16 text-center text-muted">Redirecting to sign in…</p>;
  if (error) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-cream">Order not found</h1>
        <p className="mt-2 text-muted">{error}</p>
        <Link href="/account/orders" className="mt-5 inline-block bg-primary px-6 py-3 font-display text-[13px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-primary-dark">
          Back to My Orders
        </Link>
      </div>
    );
  }
  if (!order) return <p className="py-16 text-center text-muted">Loading order…</p>;

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Link href="/account/orders" className="text-sm text-muted transition hover:text-cream">← My Orders</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-4xl font-black uppercase tracking-tight text-cream">{order.orderNumber}</h1>
        <span className="bg-primary px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white">{order.status}</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Placed {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <section className="mt-6 border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-cream">Items</h2>
        <ul className="mt-3 space-y-3">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" loading="lazy" className="h-14 w-14 object-cover" />
              )}
              <span className="flex-1 text-muted">{item.name} <span className="text-muted-2">× {item.quantity}</span></span>
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
      </section>

      {order.shippingAddress && (
        <section className="mt-4 border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-cream">Delivery Address</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.zipCode}, {order.shippingAddress.country}
          </p>
          {(order.shipment.trackingNumber || order.shipment.shippedAt) && (
            <div className="mt-3 border-t border-line pt-3 text-sm">
              <p className="font-semibold text-cream">Shipment</p>
              {order.shipment.courierName && <p className="mt-1 text-muted">Courier: {order.shipment.courierName}</p>}
              {order.shipment.trackingNumber && <p className="text-muted">Tracking number: {order.shipment.trackingNumber}</p>}
              {order.shipment.trackingUrl && (
                <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-primary transition hover:text-cream">
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
