"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall, formatMoney, type MyOrder } from "@/lib/api";
import { useShop } from "@/lib/store";

export default function MyOrdersPage() {
  const { user, ready } = useShop();
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
      .catch(() => setError("Could not load your orders."));
  }, [user]);

  if (!user) return <p className="py-16 text-center text-muted">Redirecting to sign in…</p>;

  return (
    <div className="py-8">
      <h1 className="text-3xl font-extrabold text-cream">My Orders</h1>
      {error && <p className="mt-4 text-sm text-primary" role="alert">{error}</p>}
      {orders === null && !error && <p className="mt-6 text-muted">Loading your orders…</p>}
      {orders !== null && orders.length === 0 && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-10 text-center">
          <p className="font-semibold text-cream">You have not placed any orders yet.</p>
          <Link href="/shop" className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-sm font-bold text-white transition hover:bg-primary-dark">
            Start Shopping
          </Link>
        </div>
      )}
      {orders !== null && orders.length > 0 && (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li key={order._id}>
              <Link
                href={`/account/orders/${order._id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5 transition hover:border-primary/60"
              >
                <span>
                  <span className="block font-bold text-cream">{order.orderNumber}</span>
                  <span className="text-sm text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    {" · "}{order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="rounded-full bg-ink-2 px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted">
                    {order.status}
                  </span>
                  <span className="font-extrabold text-cream">{formatMoney(order.total, currency)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
