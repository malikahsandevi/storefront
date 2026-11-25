"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall, type CustomerAddress, type CustomerProfile } from "@/lib/api";
import { useShop } from "@/lib/store";

const inputCls =
  "w-full border border-line bg-ink-2 px-3.5 py-2.5 text-sm text-cream placeholder:text-muted-2";
const labelCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-muted-2";

const emptyAddress: CustomerAddress = {
  street: "", city: "", state: "", zipCode: "", country: "Pakistan", isDefault: false,
};

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
    return <p className="py-16 text-center text-muted">Redirecting to sign in…</p>;
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
    <div className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-5xl font-black uppercase tracking-tight text-cream sm:text-6xl">My Account</h1>
        <div className="flex gap-2">
          <Link href="/account/orders" className="border border-line px-5 py-2 text-sm font-semibold text-muted transition hover:border-primary hover:text-cream">
            My Orders
          </Link>
          <Link href="/wishlist" className="border border-line px-5 py-2 text-sm font-semibold text-muted transition hover:border-primary hover:text-cream">
            Wishlist
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="border border-line px-5 py-2 text-sm font-semibold text-muted transition hover:border-primary hover:text-cream"
          >
            Sign Out
          </button>
        </div>
      </div>

      {profile && (
        <p className="mt-2 text-sm text-muted">
          {profile.email} · Customer since{" "}
          {new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-primary" role="alert">{error}</p>}

      <form onSubmit={save} className="mt-6 space-y-6">
        <section className="border border-line bg-surface p-6" aria-labelledby="profile-h">
          <h2 id="profile-h" className="font-display text-lg font-extrabold uppercase tracking-tight text-cream">Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ac-first" className={labelCls}>First name</label>
              <input id="ac-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="ac-last" className={labelCls}>Last name</label>
              <input id="ac-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="ac-phone" className={labelCls}>Phone</label>
              <input id="ac-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </div>
          </div>
        </section>

        <section className="border border-line bg-surface p-6" aria-labelledby="addr-h">
          <div className="flex items-center justify-between">
            <h2 id="addr-h" className="font-display text-lg font-extrabold uppercase tracking-tight text-cream">Address Book</h2>
            <button
              type="button"
              onClick={() => setAddresses((prev) => [...prev, { ...emptyAddress }])}
              className="border border-primary px-4 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
            >
              + Add Address
            </button>
          </div>
          {addresses.length === 0 && (
            <p className="mt-3 text-sm text-muted">No saved addresses yet — add one to check out faster.</p>
          )}
          <div className="mt-4 space-y-4">
            {addresses.map((address, i) => (
              <fieldset key={i} className="border border-line bg-ink-2 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelCls} htmlFor={`addr-${i}-street`}>Street address</label>
                    <input id={`addr-${i}-street`} value={address.street} onChange={(e) => updateAddress(i, { street: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor={`addr-${i}-city`}>City</label>
                    <input id={`addr-${i}-city`} value={address.city} onChange={(e) => updateAddress(i, { city: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor={`addr-${i}-state`}>State / Province</label>
                    <input id={`addr-${i}-state`} value={address.state} onChange={(e) => updateAddress(i, { state: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor={`addr-${i}-zip`}>ZIP / Postal code</label>
                    <input id={`addr-${i}-zip`} value={address.zipCode} onChange={(e) => updateAddress(i, { zipCode: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor={`addr-${i}-country`}>Country</label>
                    <input id={`addr-${i}-country`} value={address.country} onChange={(e) => updateAddress(i, { country: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={address.isDefault}
                      onChange={(e) =>
                        setAddresses((prev) => prev.map((a, j) => ({ ...a, isDefault: e.target.checked ? j === i : a.isDefault && j !== i })))
                      }
                      className="accent-primary"
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
        <button type="submit" disabled={saving} className="bg-primary px-9 py-3.5 font-display text-[13px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-primary-dark active:scale-[0.98] disabled:opacity-60">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
