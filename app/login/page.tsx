"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/lib/store";

/** Sign in: the previous build's customer login wiring, vault
 *  panel form. */
export default function LoginPage() {
  const { login } = useShop();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="wrap max-w-md py-14 md:py-20">
      <p className="kicker">
        <span>Account</span>
        <span className="kicker__bar" aria-hidden />
      </p>
      <h1 className="h1-page mt-4">Sign In</h1>
      <p className="mt-3 text-sm text-muted">
        New here? <Link href="/register" className="font-semibold text-primary transition hover:text-cream">Create an account</Link>
      </p>
      <form
        className="panel panel--pad mt-7 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await login(email.trim(), password);
            router.push("/account");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not sign in.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <label htmlFor="li-email" className="flabel">Email *</label>
          <input id="li-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="li-password" className="flabel">Password *</label>
          <input id="li-password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" autoComplete="current-password" />
          <p className="mt-2 text-right text-sm">
            <Link href="/forgot-password" className="font-semibold text-primary transition hover:text-cream">Forgot password?</Link>
          </p>
        </div>
        {error && <p className="text-sm text-primary" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn--primary btn--block disabled:opacity-60">
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
