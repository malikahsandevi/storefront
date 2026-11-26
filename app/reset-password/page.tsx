"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiCall } from "@/lib/api";
import { useShop } from "@/lib/store";

/** Reset password: the emailed link lands here with ?token=… — the
 *  token is the credential (single-use, 1-hour expiry, enforced by
 *  the backend). No token, or a refused token, lands on a plain
 *  invalid-link state that points back to Forgot Password. */
function ResetForm() {
  const { openAuth } = useShop();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <div className="panel panel--pad mt-7">
        <p className="text-sm leading-relaxed text-muted">
          This reset link is invalid or has expired. Request a new one and use the
          link from the latest email.
        </p>
        <Link href="/forgot-password" className="btn btn--primary btn--block mt-5">
          Request a New Link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="panel panel--pad mt-7">
        <p className="text-sm leading-relaxed text-muted">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <button type="button" className="btn btn--primary btn--block mt-5" onClick={() => openAuth("login")}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <form
      className="panel panel--pad mt-7 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        if (password.length < 6) {
          setError("The new password must be at least 6 characters.");
          return;
        }
        if (password !== confirm) {
          setError("The two passwords do not match.");
          return;
        }
        setBusy(true);
        try {
          await apiCall("POST", "/api/storefront/auth/reset-password", { token, password });
          setDone(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not reset your password.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label htmlFor="rp-password" className="flabel">New password *</label>
        <input id="rp-password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" autoComplete="new-password" />
      </div>
      <div>
        <label htmlFor="rp-confirm" className="flabel">Confirm new password *</label>
        <input id="rp-confirm" required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" autoComplete="new-password" />
      </div>
      {error && <p className="text-sm text-primary" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn--primary btn--block disabled:opacity-60">
        {busy ? "Resetting…" : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="wrap max-w-md py-14 md:py-20">
      <p className="kicker">
        <span>Account</span>
        <span className="kicker__bar" aria-hidden />
      </p>
      <h1 className="h1-page mt-4">Reset Password</h1>
      <p className="mt-3 text-sm text-muted">
        Choose a new password for your account.
      </p>
      <Suspense fallback={<p className="mt-7 text-sm text-muted">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
