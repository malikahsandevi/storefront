"use client";

import Link from "next/link";
import { useState } from "react";
import { apiCall } from "@/lib/api";

/** Forgot password: ask for the account email. The backend always
 *  answers with the same generic message (a reset link is sent only
 *  when the account exists), and this page mirrors that — the sent
 *  state never confirms or denies an account. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="wrap max-w-md py-14 md:py-20">
      <p className="kicker">
        <span>Account</span>
        <span className="kicker__bar" aria-hidden />
      </p>
      <h1 className="h1-page mt-4">Forgot Password</h1>
      <p className="mt-3 text-sm text-muted">
        Remembered it after all? <Link href="/login" className="font-semibold text-primary transition hover:text-cream">Sign in</Link>
      </p>
      {sent ? (
        <div className="panel panel--pad mt-7">
          <p className="text-sm leading-relaxed text-muted">
            If an account with that email exists, a password reset link has been sent.
            The link expires in 1 hour and can be used only once.
          </p>
          <Link href="/login" className="btn btn--primary btn--block mt-5">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form
          className="panel panel--pad mt-7 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await apiCall("POST", "/api/storefront/auth/forgot-password", { email: email.trim() });
            } catch {
              // The answer is generic by design — a network failure
              // lands on the same sent state rather than leaking
              // anything about the account.
            } finally {
              setBusy(false);
              setSent(true);
            }
          }}
        >
          <div>
            <label htmlFor="fp-email" className="flabel">Email *</label>
            <input id="fp-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
          </div>
          <button type="submit" disabled={busy} className="btn btn--primary btn--block disabled:opacity-60">
            {busy ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}
    </div>
  );
}
