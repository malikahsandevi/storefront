"use client";

import { useState } from "react";
import { apiCall } from "@/lib/api";

/** Pay Now for a placed-but-unpaid card order: asks the backend for a
 *  fresh Stripe Checkout session for the STORED order (the amount is
 *  the order's, never the client's) and redirects to Stripe's hosted
 *  page. Rendered only when the backend says the order can still be
 *  paid online (canPayOnline) — the button never guesses.
 *
 *  Tracking and the account pages are both signed-in surfaces now,
 *  so the /checkout return landing re-reads the order through the
 *  account — nothing needs to be stashed for a guest lookup. */
export default function PayNowButton({
  orderId,
  token,
  label = "Pay Now",
}: {
  orderId: string;
  token?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    setBusy(true);
    setError("");
    try {
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
