"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/lib/store";

const inputCls =
  "w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm text-cream placeholder:text-muted-2";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-2";

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
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-3xl font-extrabold text-cream">Create Account</h1>
      <p className="mt-2 text-sm text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-primary hover:text-cream">Sign in</Link>
      </p>
      <form
        className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-6"
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
            <label htmlFor="rg-first" className={labelCls}>First name *</label>
            <input id="rg-first" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} autoComplete="given-name" />
          </div>
          <div>
            <label htmlFor="rg-last" className={labelCls}>Last name</label>
            <input id="rg-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} autoComplete="family-name" />
          </div>
        </div>
        <div>
          <label htmlFor="rg-email" className={labelCls}>Email *</label>
          <input id="rg-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="rg-password" className={labelCls}>Password *</label>
          <input id="rg-password" required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
          <p className="mt-1 text-xs text-muted-2">At least 6 characters.</p>
        </div>
        {error && <p className="text-sm text-primary" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-full bg-primary py-2.5 font-bold text-white transition hover:bg-primary-dark disabled:opacity-60">
          {busy ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
