"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/lib/store";

const inputCls =
  "w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm text-cream placeholder:text-muted-2";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-2";

export default function LoginPage() {
  const { login } = useShop();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-3xl font-extrabold text-cream">Sign In</h1>
      <p className="mt-2 text-sm text-muted">
        New here? <Link href="/register" className="font-semibold text-primary hover:text-cream">Create an account</Link>
      </p>
      <form
        className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-6"
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
        <button type="submit" disabled={busy} className="w-full rounded-full bg-primary py-2.5 font-bold text-white transition hover:bg-primary-dark disabled:opacity-60">
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
