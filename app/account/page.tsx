"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall, ApiError, type CustomerAddress, type CustomerProfile } from "@/lib/api";
import { useShop } from "@/lib/store";

const emptyAddress: CustomerAddress = {
  street: "", city: "", state: "", zipCode: "", country: "Pakistan", isDefault: false,
};

/** My Account: the previous build's profile + address-book
 *  wiring (redirect when signed out, /me fetch + save with the
 *  session token), restyled as numbered vault panels. */
export default function AccountPage() {
  const { user, ready, logout, expireSession, openAuth } = useShop();
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // No valid session: home with the sign-in POPUP open (there
  // is no login page), remembering this page so a successful
  // sign-in lands the visitor right back here.
  useEffect(() => {
    if (ready && !user) {
      openAuth("login", "/account");
      router.replace("/");
    }
  }, [ready, user, openAuth, router]);

  useEffect(() => {
    if (!user) return;
    apiCall<CustomerProfile>("GET", "/api/storefront/me", undefined, user.token)
      .then((data) => {
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setPhone(data.phone);
        setAddresses(data.addresses);
      })
      .catch((err) => {
        // A 401/403 here means the session died after it was
        // restored — that is a sign-out, not a load error: drop
        // the session and the redirect above takes over. Only a
        // genuine failure for a live session shows the error.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          expireSession();
        } else {
          setError("Could not load your profile.");
        }
      });
  }, [user, expireSession]);

  if (!ready) {
    return <p className="wrap py-16 text-center text-muted">Loading…</p>;
  }

  if (!user) {
    return <p className="wrap py-16 text-center text-muted">Opening sign in…</p>;
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await apiCall<CustomerProfile>("PUT", "/api/storefront/me", {
        firstName, lastName, phone, addresses,
      }, user.token);
      setProfile(updated);
      setAddresses(updated.addresses);
      setMessage("Your profile has been saved.");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        expireSession();
        return;
      }
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const updateAddress = (index: number, patch: Partial<CustomerAddress>) =>
    setAddresses((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));

  // Password change is its own form + endpoint: the current password
  // is the credential, so it never rides along with the profile save.
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwMessage("");
    if (newPassword.length < 6) {
      setPwError("The new password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("The two passwords do not match.");
      return;
    }
    setPwSaving(true);
    try {
      const res = await apiCall<{ message: string }>("PUT", "/api/storefront/me/password", {
        currentPassword, newPassword,
      }, user.token);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMessage(res.message || "Your password has been changed.");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        expireSession();
        return;
      }
      setPwError(err instanceof Error ? err.message : "Could not change your password.");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="wrap max-w-5xl py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h1-page">My Account</h1>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/account/orders" className="btn btn--ghost btn--sm">My Orders</Link>
          <Link href="/wishlist" className="btn btn--ghost btn--sm">Wishlist</Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="btn btn--ghost btn--sm"
          >
            Sign Out
          </button>
        </div>
      </div>

      {profile && (
        <p className="mt-3 text-sm text-muted">
          {profile.email} · Customer since{" "}
          {new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-primary" role="alert">{error}</p>}

      <form onSubmit={save} className="mt-8 space-y-6">
        <section className="panel panel--pad" aria-labelledby="profile-h">
          <p className="kicker">
            <span className="kicker__idx">01</span>
            <span className="kicker__bar" aria-hidden />
          </p>
          <h2 id="profile-h" className="mt-3 font-display text-xl font-medium text-cream">Profile</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ac-first" className="flabel">First name</label>
              <input id="ac-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="ac-last" className="flabel">Last name</label>
              <input id="ac-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="ac-phone" className="flabel">Phone</label>
              <input id="ac-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            </div>
          </div>
        </section>

        <section className="panel panel--pad" aria-labelledby="addr-h">
          <p className="kicker">
            <span className="kicker__idx">02</span>
            <span className="kicker__bar" aria-hidden />
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <h2 id="addr-h" className="font-display text-xl font-medium text-cream">Address Book</h2>
            <button
              type="button"
              onClick={() => setAddresses((prev) => [...prev, { ...emptyAddress }])}
              className="btn btn--ghost btn--sm"
            >
              + Add Address
            </button>
          </div>
          {addresses.length === 0 && (
            <p className="mt-4 text-sm text-muted">No saved addresses yet — add one to check out faster.</p>
          )}
          <div className="mt-5 space-y-4">
            {addresses.map((address, i) => (
              <fieldset key={i} className="rounded-2xl border border-line bg-ink-2 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="flabel" htmlFor={`addr-${i}-street`}>Street address</label>
                    <input id={`addr-${i}-street`} value={address.street} onChange={(e) => updateAddress(i, { street: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="flabel" htmlFor={`addr-${i}-city`}>City</label>
                    <input id={`addr-${i}-city`} value={address.city} onChange={(e) => updateAddress(i, { city: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="flabel" htmlFor={`addr-${i}-state`}>State / Province</label>
                    <input id={`addr-${i}-state`} value={address.state} onChange={(e) => updateAddress(i, { state: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="flabel" htmlFor={`addr-${i}-zip`}>ZIP / Postal code</label>
                    <input id={`addr-${i}-zip`} value={address.zipCode} onChange={(e) => updateAddress(i, { zipCode: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="flabel" htmlFor={`addr-${i}-country`}>Country</label>
                    <input id={`addr-${i}-country`} value={address.country} onChange={(e) => updateAddress(i, { country: e.target.value })} className="input" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={address.isDefault}
                      onChange={(e) =>
                        setAddresses((prev) => prev.map((a, j) => ({ ...a, isDefault: e.target.checked ? j === i : a.isDefault && j !== i })))
                      }
                      className="chk"
                    />
                    Default address
                  </label>
                  <button
                    type="button"
                    onClick={() => setAddresses((prev) => prev.filter((_, j) => j !== i))}
                    className="text-sm text-muted-2 transition hover:text-primary"
                  >
                    Remove
                  </button>
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        {message && <p className="text-sm text-emerald-400" role="status">{message}</p>}
        <button type="submit" disabled={saving} className="btn btn--primary disabled:opacity-60">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <form onSubmit={changePassword} className="mt-6">
        <section className="panel panel--pad" aria-labelledby="pw-h">
          <p className="kicker">
            <span className="kicker__idx">03</span>
            <span className="kicker__bar" aria-hidden />
          </p>
          <h2 id="pw-h" className="mt-3 font-display text-xl font-medium text-cream">Password</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ac-pw-current" className="flabel">Current password</label>
              <input id="ac-pw-current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input" autoComplete="current-password" />
            </div>
            <div>
              <label htmlFor="ac-pw-new" className="flabel">New password</label>
              <input id="ac-pw-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" autoComplete="new-password" />
            </div>
            <div>
              <label htmlFor="ac-pw-confirm" className="flabel">Confirm new password</label>
              <input id="ac-pw-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" autoComplete="new-password" />
            </div>
          </div>
          {pwError && <p className="mt-4 text-sm text-primary" role="alert">{pwError}</p>}
          {pwMessage && <p className="mt-4 text-sm text-emerald-400" role="status">{pwMessage}</p>}
          <button type="submit" disabled={pwSaving} className="btn btn--primary mt-5 disabled:opacity-60">
            {pwSaving ? "Changing…" : "Change Password"}
          </button>
        </section>
      </form>
    </div>
  );
}
