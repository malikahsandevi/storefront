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
      <h1 className="font-display text-5xl font-black uppercase tracking-tight text-cream sm:text-6xl">My Orders</h1>
      {error && <p className="mt-4 text-sm text-primary" role="alert">{error}</p>}
      {orders === null && !error && <p className="mt-6 text-muted">Loading your orders…</p>}
      {orders !== null && orders.length === 0 && (
        <div className="vault-panel mt-6 p-12 text-center">
          <p className="font-semibold text-cream">You have not placed any orders yet.</p>
          <Link href="/shop" className="btn-primary-pill btn-shine mt-5 inline-block px-6 py-3 font-display text-[13px] font-bold uppercase tracking-[0.1em]">
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
                className="vault-panel flex flex-wrap items-center justify-between gap-3 p-6"
              >
                <span>
                  <span className="block font-display text-lg font-bold text-cream">{order.orderNumber}</span>
                  <span className="text-sm text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    {" · "}{order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="rounded-full border border-line bg-ink-2 px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted">
                    {order.status}
                  </span>
                  <span className="font-display text-lg font-extrabold text-cream">{formatMoney(order.total, currency)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
