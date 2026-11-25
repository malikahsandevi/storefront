"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/lib/store";

const inputCls =
  "w-full rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-sm text-cream placeholder:text-muted-2";
const labelCls = "mono-label mb-1.5 block text-muted-2";

export default function LoginPage() {
  const { login } = useShop();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="flex items-center gap-3">
        <span className="mono-label text-muted-2">Account</span>
        <span aria-hidden className="kicker-bar" />
      </div>
      <h1 className="mt-3 font-display text-5xl font-black uppercase tracking-tight text-cream">Sign In</h1>
      <p className="mt-2 text-sm text-muted">
        New here? <Link href="/register" className="font-semibold text-primary hover:text-cream">Create an account</Link>
      </p>
      <form
        className="vault-panel mt-6 space-y-4 p-7 sm:p-8"
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
          <label htmlFor="li-email" className={labelCls}>Email *</label>
          <input id="li-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="li-password" className={labelCls}>Password *</label>
          <input id="li-password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
        </div>
        {error && <p className="text-sm text-primary" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary-pill btn-shine w-full py-3.5 font-display text-sm font-bold uppercase tracking-[0.1em] disabled:opacity-60">
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
