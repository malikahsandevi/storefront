"use client";

import { useState } from "react";
import { apiCall } from "@/lib/api";

/** Pay Now for a placed-but-unpaid card order: asks the backend for a
 *  fresh Stripe Checkout session for the STORED order (the amount is
 *  the order's, never the client's) and redirects to Stripe's hosted
 *  page. Rendered only when the backend says the order can still be
 *  paid online (canPayOnline) — the button never guesses.
 *
 *  Guests paying from order tracking pass `stash` (the order number +
 *  email they just proved) so the /checkout return landing can read
 *  the order's real status afterwards, exactly as a checkout-started
 *  payment does. */
export default function PayNowButton({
  orderId,
  token,
  stash,
  label = "Pay Now",
}: {
  orderId: string;
  token?: string;
  stash?: { orderNumber: string; email: string };
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    setBusy(true);
    setError("");
    try {
      if (stash) {
        sessionStorage.setItem("stripe-return", JSON.stringify(stash));
      }
      const { url } = await apiCall<{ url: string }>(
        "POST", `/api/storefront/orders/${orderId}/stripe-session`, {}, token,
      );
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Online payment could not be started.");
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={pay} disabled={busy} className="btn btn--primary btn--sm disabled:opacity-60">
        {busy ? "Starting payment…" : label}
      </button>
      {error && <p className="mt-2 text-sm text-primary" role="alert">{error}</p>}
    </div>
  );
}
