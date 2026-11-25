"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/lib/store";

/** Create account: the previous build's registration wiring,
 *  vault panel form. */
export default function RegisterPage() {
  const { register } = useShop();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
      <h1 className="h1-page mt-4">Create Account</h1>
      <p className="mt-3 text-sm text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-primary transition hover:text-cream">Sign in</Link>
      </p>
      <form
        className="panel panel--pad mt-7 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await register({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password });
            router.push("/account");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create your account.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rg-first" className="flabel">First name *</label>
            <input id="rg-first" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" autoComplete="given-name" />
          </div>
          <div>
            <label htmlFor="rg-last" className="flabel">Last name</label>
            <input id="rg-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" autoComplete="family-name" />
          </div>
        </div>
        <div>
          <label htmlFor="rg-email" className="flabel">Email *</label>
          <input id="rg-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="rg-password" className="flabel">Password *</label>
          <input id="rg-password" required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" autoComplete="new-password" />
          <p className="mt-1.5 text-xs text-muted-2">At least 6 characters.</p>
        </div>
        {error && <p className="text-sm text-primary" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn--primary btn--block disabled:opacity-60">
          {busy ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
