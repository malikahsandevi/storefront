"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall, ApiError, formatMoney, type MyOrder } from "@/lib/api";
import { useShop } from "@/lib/store";

/** My Orders list: the previous build's fetch (/me/orders with
 *  the session token), rows as vault panels. */
export default function MyOrdersPage() {
  const { user, ready, expireSession } = useShop();
  const router = useRouter();
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    apiCall<{ currency: string }>("GET", "/api/storefront/config")
      .then((config) => setCurrency(config.currency || "USD"))
      .catch(() => {});
    if (!user) return;
    apiCall<MyOrder[]>("GET", "/api/storefront/me/orders", undefined, user.token)
      .then(setOrders)
      .catch((err) => {
        // Session died after restore → sign-out path (the
        // redirect above fires); other failures keep the error.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          expireSession();
        } else {
          setError("Could not load your orders.");
        }
      });
  }, [user, expireSession]);

  if (!ready) return <p className="wrap py-16 text-center text-muted">Loading…</p>;
  if (!user) return <p className="wrap py-16 text-center text-muted">Redirecting to sign in…</p>;

  return (
    <div className="wrap max-w-4xl py-12 md:py-16">
      <p className="kicker">
        <span className="kicker__idx">Account</span>
        <span>Order history</span>
        <span className="kicker__bar" aria-hidden />
      </p>
      <h1 className="h1-page mt-4">My Orders</h1>
      {error && <p className="mt-5 text-sm text-primary" role="alert">{error}</p>}
      {orders === null && !error && <p className="mt-6 text-muted">Loading your orders…</p>}
      {orders !== null && orders.length === 0 && (
        <div className="panel panel--pad mt-8 text-center">
          <p className="font-semibold text-cream">You have not placed any orders yet.</p>
          <Link href="/shop" className="btn btn--primary btn--sm mt-5">Start Shopping</Link>
        </div>
      )}
      {orders !== null && orders.length > 0 && (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li key={order._id}>
              <Link
                href={`/account/orders/${order._id}`}
                className="panel flex flex-wrap items-center justify-between gap-3 px-6 py-5 transition hover:border-primary/50"
              >
                <span>
                  <span className="block font-display text-lg font-medium text-cream">{order.orderNumber}</span>
                  <span className="text-sm text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    {" · "}{order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                  </span>
                </span>
                <span className="flex items-center gap-3.5">
                  <span className="rounded-full border border-line bg-ink-2 px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide text-muted">
                    {order.status}
                  </span>
                  <span className="font-display text-lg font-semibold text-cream">{formatMoney(order.total, currency)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
