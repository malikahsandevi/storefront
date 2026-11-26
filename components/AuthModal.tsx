"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useShop, type AuthMode } from "@/lib/store";
import { IconClose } from "./icons";

/**
 * Sign in / Create account as ONE popup — the industry-standard
 * surface Ahsan ordered (2026-11-26: "login or signup popups
 * hoty hain"). There are no standalone login/register pages any
 * more: every entry point (header Login, mobile menu, footer,
 * the account guards, the forgot/reset pages' sign-in links)
 * opens this modal through the shop state (lib/store), in the
 * mode it needs. The forms are the old pages' own fields,
 * validation and error wording, carried over unchanged; a
 * successful sign-in closes the popup and — when a guard
 * bounced the visitor here — lands them on the page they
 * originally wanted (authNext). "Forgot password?" stays a
 * page: the emailed reset link needs one.
 */
export default function AuthModal() {
  const { authOpen, authMode, authNext, closeAuth, switchAuthMode, login, register } =
    useShop();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Switching modes (or reopening) starts from a clean error;
  // the typed email/password carry across the switch. Adjusted
  // during render (React's derived-state pattern) so no effect
  // has to reach for setState.
  const [errorStamp, setErrorStamp] = useState("");
  const currentStamp = `${authOpen}:${authMode}`;
  if (errorStamp !== currentStamp) {
    setErrorStamp(currentStamp);
    if (error) setError("");
  }

  // Focus lands on the first field whenever the popup opens or
  // the mode flips — the visitor can type at once.
  useEffect(() => {
    if (authOpen) firstFieldRef.current?.focus();
  }, [authOpen, authMode]);

  // Escape closes and the page behind locks its scroll — the
  // same behaviour as the cart drawer.
  useEffect(() => {
    if (!authOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuth();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [authOpen, closeAuth]);

  if (!authOpen) return null;

  const mode: AuthMode = authMode;

  const finish = () => {
    // Capture the destination before closeAuth clears it.
    const dest = authNext;
    closeAuth();
    if (dest) router.push(dest);
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), password);
      finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="auth-root"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "login" ? "Sign in" : "Create account"}
    >
      <button
        type="button"
        aria-label="Close sign in"
        className="auth__backdrop"
        onClick={closeAuth}
      />
      <div className="auth__card">
        <div className="auth__head">
          <div>
            <p className="kicker">
              <span>Account</span>
              <span className="kicker__bar" aria-hidden />
            </p>
            <h2 className="auth__title">
              {mode === "login" ? "Sign In" : "Create Account"}
            </h2>
          </div>
          <button type="button" className="hdr__icon" aria-label="Close" onClick={closeAuth}>
            <IconClose />
          </button>
        </div>

        <div className="auth__tabs" role="tablist" aria-label="Sign in or create account">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className="auth__tab"
            onClick={() => switchAuthMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className="auth__tab"
            onClick={() => switchAuthMode("register")}
          >
            Create Account
          </button>
        </div>

        {mode === "login" ? (
          <form className="mt-6 space-y-4" onSubmit={submitLogin}>
            <div>
              <label htmlFor="am-email" className="flabel">Email *</label>
              <input
                id="am-email"
                ref={firstFieldRef}
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="am-password" className="flabel">Password *</label>
              <input
                id="am-password"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete="current-password"
              />
              <p className="mt-2 text-right text-sm">
                <Link
                  href="/forgot-password"
                  className="font-semibold text-primary transition hover:text-cream"
                  onClick={closeAuth}
                >
                  Forgot password?
                </Link>
              </p>
            </div>
            {error && <p className="text-sm text-primary" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn--primary btn--block disabled:opacity-60">
              {busy ? "Signing in…" : "Sign In"}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submitRegister}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="am-first" className="flabel">First name *</label>
                <input
                  id="am-first"
                  ref={firstFieldRef}
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label htmlFor="am-last" className="flabel">Last name</label>
                <input
                  id="am-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div>
              <label htmlFor="am-rg-email" className="flabel">Email *</label>
              <input
                id="am-rg-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="am-rg-password" className="flabel">Password *</label>
              <input
                id="am-rg-password"
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete="new-password"
              />
              <p className="mt-1.5 text-xs text-muted-2">At least 6 characters.</p>
            </div>
            {error && <p className="text-sm text-primary" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn--primary btn--block disabled:opacity-60">
              {busy ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
