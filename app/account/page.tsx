"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall, type CustomerAddress, type CustomerProfile } from "@/lib/api";
import { useShop } from "@/lib/store";

const emptyAddress: CustomerAddress = {
  street: "", city: "", state: "", zipCode: "", country: "Pakistan", isDefault: false,
};

/** My Account: the previous build's profile + address-book
 *  wiring (redirect when signed out, /me fetch + save with the
 *  session token), restyled as numbered vault panels. */
export default function AccountPage() {
  const { user, ready, logout } = useShop();
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

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
      .catch(() => setError("Could not load your profile."));
  }, [user]);

  if (!user) {
    return <p className="wrap py-16 text-center text-muted">Redirecting to sign in…</p>;
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
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const updateAddress = (index: number, patch: Partial<CustomerAddress>) =>
    setAddresses((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));

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
    </div>
  );
}
