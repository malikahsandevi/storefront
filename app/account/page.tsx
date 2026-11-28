"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  apiCall,
  ApiError,
  formatMoney,
  type CustomerAddress,
  type CustomerProfile,
  type MyOrder,
} from "@/lib/api";
import { useShop, type ProductLike } from "@/lib/store";
import AccountAvatar from "@/components/AccountAvatar";
import ImageCropper from "@/components/ImageCropper";
import { IconBag, IconBox, IconClose, IconHeart, IconTruck } from "@/components/icons";

const emptyAddress: CustomerAddress = {
  street: "", city: "", state: "", zipCode: "", country: "Pakistan", isDefault: false,
};

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-2">{label}</p>
      <p className="mt-1.5 font-medium leading-snug text-cream">{value}</p>
    </div>
  );
}

/** My Account — the profile page in the layout Ahsan picked
 *  (2026-11-28): a big-photo profile card beside an "Account &
 *  other details" card, a quick-links band, recent orders as
 *  "My Orders", the wishlist as "My Collection", and the password
 *  form below. Every capability of the previous page survives:
 *  profile edit and the address book open as modals from the
 *  details card, the password form is unchanged, and the sign-in
 *  guard behaves exactly as before. */
export default function AccountPage() {
  const { user, ready, logout, expireSession, openAuth, wishlist, toggleWishlist } = useShop();
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // Photo change: picking a file opens the 1:1 cropper; only its
  // cropped square ever uploads.
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  // True while the profile photo fills its card (eye view): the
  // card's other content fades out/in in sync with the morph.
  const [cardFill, setCardFill] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState("");
  // Edit-profile modal drafts
  const [editOpen, setEditOpen] = useState(false);
  const [draftFirst, setDraftFirst] = useState("");
  const [draftLast, setDraftLast] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  // Address-book modal drafts
  const [addrOpen, setAddrOpen] = useState(false);
  const [draftAddresses, setDraftAddresses] = useState<CustomerAddress[]>([]);
  const [addrError, setAddrError] = useState("");
  const [addrSaving, setAddrSaving] = useState(false);
  // Password form (unchanged from the previous page)
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
      .then(setProfile)
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
    apiCall<MyOrder[]>("GET", "/api/storefront/me/orders", undefined, user.token)
      .then(setOrders)
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          expireSession();
        } else {
          setOrders([]);
        }
      });
    apiCall<{ currency: string }>("GET", "/api/storefront/config")
      .then((config) => setCurrency(config.currency || "USD"))
      .catch(() => {});
  }, [user, expireSession]);

  // Modal behaviour, shared with the auth popup: Escape closes,
  // the page behind locks its scroll, backdrop click cancels.
  const anyModalOpen = editOpen || addrOpen;
  useEffect(() => {
    if (!anyModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditOpen(false);
        setAddrOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [anyModalOpen]);

  if (!ready) {
    return <p className="wrap py-16 text-center text-muted">Loading…</p>;
  }

  if (!user) {
    return <p className="wrap py-16 text-center text-muted">Opening sign in…</p>;
  }

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim() || profile.email
    : "";
  const memberSince = profile
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "";
  const memberSinceFull = profile
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const defaultAddress = profile
    ? profile.addresses.find((a) => a.isDefault) || profile.addresses[0]
    : undefined;

  const onPhotoPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError("");
    setPhotoMessage("");
    if (!AVATAR_TYPES.includes(file.type)) {
      setPhotoError("Use a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Choose a photo of 5 MB or smaller.");
      return;
    }
    // Into the cropper — nothing uploads until its square is confirmed.
    setCropSrc(URL.createObjectURL(file));
  };

  const closeCrop = () => {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  /** The cropper's confirm: upload its 1:1 square (≤512px JPEG —
   *  far under the backend's 2 MB cap). Rejects on failure so the
   *  cropper can show the error and stay open for a retry. */
  const confirmCrop = async (dataUrl: string) => {
    setPhotoBusy(true);
    setPhotoError("");
    setPhotoMessage("");
    try {
      const updated = await apiCall<CustomerProfile>(
        "POST",
        "/api/storefront/me/avatar",
        { dataUrl },
        user.token,
      );
      setProfile(updated);
      setPhotoMessage("Your photo has been updated.");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        expireSession();
        throw new Error("Your session has expired. Please sign in again.");
      }
      throw err instanceof Error ? err : new Error("Could not update your photo.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const openEdit = () => {
    if (!profile) return;
    setDraftFirst(profile.firstName);
    setDraftLast(profile.lastName);
    setDraftPhone(profile.phone);
    setEditError("");
    setEditOpen(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setEditSaving(true);
    setEditError("");
    try {
      const updated = await apiCall<CustomerProfile>(
        "PUT",
        "/api/storefront/me",
        {
          firstName: draftFirst,
          lastName: draftLast,
          phone: draftPhone,
          addresses: profile.addresses,
        },
        user.token,
      );
      setProfile(updated);
      setEditOpen(false);
      setMessage("Your profile has been saved.");
      setError("");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        expireSession();
        return;
      }
      setEditError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setEditSaving(false);
    }
  };

  const openAddresses = () => {
    if (!profile) return;
    setDraftAddresses(profile.addresses.map((a) => ({ ...a })));
    setAddrError("");
    setAddrOpen(true);
  };

  const updateDraftAddress = (index: number, patch: Partial<CustomerAddress>) =>
    setDraftAddresses((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));

  const saveAddresses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setAddrSaving(true);
    setAddrError("");
    try {
      const updated = await apiCall<CustomerProfile>(
        "PUT",
        "/api/storefront/me",
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          addresses: draftAddresses,
        },
        user.token,
      );
      setProfile(updated);
      setAddrOpen(false);
      setMessage("Your addresses have been saved.");
      setError("");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        expireSession();
        return;
      }
      setAddrError(err instanceof Error ? err.message : "Could not save your addresses.");
    } finally {
      setAddrSaving(false);
    }
  };

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
      const res = await apiCall<{ message: string }>(
        "PUT",
        "/api/storefront/me/password",
        { currentPassword, newPassword },
        user.token,
      );
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

  const recentOrders = orders ? orders.slice(0, 5) : null;

  return (
    <div className="wrap py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h1-page">Profile</h1>
          <p className="mt-2 text-sm text-muted">View and manage your account details.</p>
        </div>
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

      {error && (
        <p className="mt-4 text-sm text-primary" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 text-sm text-emerald-400" role="status">
          {message}
        </p>
      )}

      {!profile && !error && <p className="mt-10 text-muted">Loading your profile…</p>}

      {profile && (
        <>
          {/* ── Top row: profile card + details card ─────────── */}
          <div className="mt-8 grid gap-[18px] lg:grid-cols-5">
            <section
              data-profile-card
              className="panel panel--pad flex flex-col items-center text-center lg:col-span-2"
              aria-label="Your profile"
            >
              <AccountAvatar name={fullName} avatar={profile.avatar} onFillChange={setCardFill} />
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPhotoPicked}
                className="hidden"
                aria-label="Choose a new profile photo"
              />
              {/* Everything else on the card: fades out while the
                  photo fills the card, back in as it returns. */}
              <div
                aria-hidden={cardFill}
                className="flex w-full flex-col items-center transition-opacity duration-300"
                style={{ opacity: cardFill ? 0 : 1, pointerEvents: cardFill ? "none" : "auto" }}
              >
                <h2 className="mt-5 font-display text-2xl font-semibold text-cream">{fullName}</h2>
                <p className="mt-3 text-sm text-muted">Member since {memberSince}</p>
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={() => photoInputRef.current?.click()}
                  className="btn btn--ghost btn--sm mt-6 disabled:opacity-60"
                >
                  {photoBusy ? "Uploading…" : "Change Photo"}
                </button>
                {photoMessage && (
                  <p className="mt-3 text-sm text-emerald-400" role="status">
                    {photoMessage}
                  </p>
                )}
                {photoError && (
                  <p className="mt-3 text-sm text-primary" role="alert">
                    {photoError}
                  </p>
                )}
              </div>
            </section>

            <section className="panel panel--pad lg:col-span-3" aria-labelledby="details-h">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="details-h" className="font-display text-xl font-medium text-cream">
                  Account &amp; other details
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  <button type="button" onClick={openEdit} className="btn btn--ghost btn--sm">
                    Edit Profile
                  </button>
                  <button type="button" onClick={openAddresses} className="btn btn--ghost btn--sm">
                    Manage Addresses
                  </button>
                </div>
              </div>
              <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <Detail label="Full name" value={fullName} />
                <Detail label="Email" value={profile.email} />
                <Detail label="Phone" value={profile.phone || "Not set"} />
                <Detail
                  label="Default address"
                  value={
                    defaultAddress
                      ? `${defaultAddress.street}, ${defaultAddress.city}, ${defaultAddress.country}`
                      : "Not set"
                  }
                />
                <Detail label="Member since" value={memberSinceFull} />
                <Detail
                  label="Orders placed"
                  value={orders === null ? "—" : String(orders.length)}
                />
              </div>
            </section>
          </div>

          {/* ── Quick links ──────────────────────────────────── */}
          <nav className="mt-[18px] grid grid-cols-2 gap-[18px] lg:grid-cols-4" aria-label="Account shortcuts">
            <Link href="/track-order" className="panel flex items-center gap-3.5 px-5 py-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/15 text-primary">
                <IconTruck className="h-5 w-5" />
              </span>
              <span className="font-display font-medium text-cream">Track Order</span>
            </Link>
            <Link href="/account/orders" className="panel flex items-center gap-3.5 px-5 py-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/15 text-primary">
                <IconBox className="h-5 w-5" />
              </span>
              <span className="font-display font-medium text-cream">My Orders</span>
            </Link>
            <Link href="/wishlist" className="panel flex items-center gap-3.5 px-5 py-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/15 text-primary">
                <IconHeart className="h-5 w-5" />
              </span>
              <span className="font-display font-medium text-cream">Wishlist</span>
            </Link>
            <Link href="/shop" className="panel flex items-center gap-3.5 px-5 py-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/15 text-primary">
                <IconBag className="h-5 w-5" />
              </span>
              <span className="font-display font-medium text-cream">Continue Shopping</span>
            </Link>
          </nav>

          {/* ── My Orders ────────────────────────────────────── */}
          <section className="mt-12" aria-labelledby="my-orders-h">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="my-orders-h" className="font-display text-2xl font-semibold text-cream">
                My Orders
              </h2>
              <Link href="/account/orders" className="btn btn--ghost btn--sm">
                View all
              </Link>
            </div>
            {recentOrders === null && <p className="mt-6 text-muted">Loading your orders…</p>}
            {recentOrders !== null && recentOrders.length === 0 && (
              <div className="panel panel--pad mt-6 text-center">
                <p className="font-semibold text-cream">No orders yet.</p>
                <p className="mt-2 text-sm text-muted">
                  When you place an order it will appear here.
                </p>
                <Link href="/shop" className="btn btn--primary btn--sm mt-5">
                  Start Shopping
                </Link>
              </div>
            )}
            {recentOrders !== null && recentOrders.length > 0 && (
              <ul className="mt-6 space-y-4">
                {recentOrders.map((order) => (
                  <li key={order._id}>
                    <Link
                      href={`/account/orders/${order._id}`}
                      className="panel flex flex-wrap items-center justify-between gap-3 px-6 py-5 transition hover:border-primary/50"
                    >
                      <span className="flex min-w-0 items-center gap-4">
                        {order.items[0]?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={order.items[0].image}
                            alt=""
                            loading="lazy"
                            className="h-12 w-12 flex-none rounded-xl object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-primary/15 font-display text-lg text-primary">
                            {(order.items[0]?.name || order.orderNumber).charAt(0)}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block font-display text-lg font-medium text-cream">
                            {order.orderNumber}
                          </span>
                          <span className="text-sm text-muted">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                            {" · "}
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center gap-3.5">
                        <span className="rounded-full border border-line bg-ink-2 px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide text-muted">
                          {order.status}
                        </span>
                        <span className="font-display text-lg font-semibold text-cream">
                          {formatMoney(order.total, currency)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── My Collection (wishlist) ─────────────────────── */}
          <section className="mt-12" aria-labelledby="my-collection-h">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="my-collection-h" className="font-display text-2xl font-semibold text-cream">
                My Collection
              </h2>
              <Link href="/wishlist" className="btn btn--ghost btn--sm">
                View all
              </Link>
            </div>
            {wishlist.length === 0 && (
              <div className="panel panel--pad mt-6 text-center">
                <p className="font-semibold text-cream">Your collection is empty.</p>
                <p className="mt-2 text-sm text-muted">
                  Products you save to your wishlist will appear here.
                </p>
                <Link href="/shop" className="btn btn--primary btn--sm mt-5">
                  Browse Products
                </Link>
              </div>
            )}
            {wishlist.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
                {wishlist.map((entry) => {
                  const like: ProductLike = {
                    _id: entry.productId,
                    slug: entry.slug,
                    name: entry.name,
                    image: entry.image,
                    price: entry.price,
                    comparePrice: entry.comparePrice,
                    stock: entry.stock,
                  };
                  return (
                    <article key={entry.productId} className="card group">
                      <div className="card__media">
                        <Link
                          href={`/product/${entry.slug}`}
                          className="absolute inset-0 block"
                          aria-label={entry.name}
                        >
                          {entry.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entry.image} alt={entry.name} loading="lazy" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center font-display text-4xl text-line">
                              {entry.name.charAt(0)}
                            </span>
                          )}
                        </Link>
                      </div>
                      <div className="card__body">
                        <h3 className="card__name">
                          <Link href={`/product/${entry.slug}`}>{entry.name}</Link>
                        </h3>
                        <div className="card__foot">
                          <p className="card__price">
                            {formatMoney(entry.price, currency)}
                            {entry.comparePrice && entry.comparePrice > entry.price && (
                              <s>{formatMoney(entry.comparePrice, currency)}</s>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/product/${entry.slug}`}
                            className="btn btn--ghost btn--sm flex-1"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(like)}
                            className="btn btn--ghost btn--sm flex-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* ── Password ─────────────────────────────────────────── */}
      <form onSubmit={changePassword} className="mt-12">
        <section className="panel panel--pad" aria-labelledby="pw-h">
          <h2 id="pw-h" className="font-display text-xl font-medium text-cream">
            Password
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ac-pw-current" className="flabel">
                Current password
              </label>
              <input
                id="ac-pw-current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label htmlFor="ac-pw-new" className="flabel">
                New password
              </label>
              <input
                id="ac-pw-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="ac-pw-confirm" className="flabel">
                Confirm new password
              </label>
              <input
                id="ac-pw-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                autoComplete="new-password"
              />
            </div>
          </div>
          {pwError && (
            <p className="mt-4 text-sm text-primary" role="alert">
              {pwError}
            </p>
          )}
          {pwMessage && (
            <p className="mt-4 text-sm text-emerald-400" role="status">
              {pwMessage}
            </p>
          )}
          <button type="submit" disabled={pwSaving} className="btn btn--primary mt-5 disabled:opacity-60">
            {pwSaving ? "Changing…" : "Change Password"}
          </button>
        </section>
      </form>

      {/* ── Edit Profile modal ───────────────────────────────── */}
      {editOpen && profile && (
        <div className="auth-root" role="dialog" aria-modal="true" aria-labelledby="edit-profile-h">
          <button
            type="button"
            aria-label="Close"
            className="auth__backdrop"
            onClick={() => setEditOpen(false)}
          />
          <div className="auth__card">
            <div className="auth__head">
              <h2 id="edit-profile-h" className="auth__title">
                Edit Profile
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEditOpen(false)}
                className="text-muted transition hover:text-cream"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveProfile} className="mt-5 space-y-4">
              <div>
                <label htmlFor="ac-first" className="flabel">
                  First name
                </label>
                <input
                  id="ac-first"
                  value={draftFirst}
                  onChange={(e) => setDraftFirst(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="ac-last" className="flabel">
                  Last name
                </label>
                <input
                  id="ac-last"
                  value={draftLast}
                  onChange={(e) => setDraftLast(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="ac-phone" className="flabel">
                  Phone
                </label>
                <input
                  id="ac-phone"
                  value={draftPhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <span className="flabel">Email</span>
                <p className="input flex items-center text-muted" aria-readonly="true">
                  {profile.email}
                </p>
                <p className="mt-1.5 text-xs text-muted-2">
                  Your email is your sign-in and cannot be changed here.
                </p>
              </div>
              {editError && (
                <p className="text-sm text-primary" role="alert">
                  {editError}
                </p>
              )}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="btn btn--ghost flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={editSaving} className="btn btn--primary flex-1 disabled:opacity-60">
                  {editSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Address Book modal ───────────────────────────────── */}
      {addrOpen && profile && (
        <div className="auth-root" role="dialog" aria-modal="true" aria-labelledby="addr-book-h">
          <button
            type="button"
            aria-label="Close"
            className="auth__backdrop"
            onClick={() => setAddrOpen(false)}
          />
          <div className="auth__card auth__card--wide">
            <div className="auth__head">
              <h2 id="addr-book-h" className="auth__title">
                Address Book
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setAddrOpen(false)}
                className="text-muted transition hover:text-cream"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveAddresses} className="mt-5">
              {draftAddresses.length === 0 && (
                <p className="text-sm text-muted">
                  No saved addresses yet — add one to check out faster.
                </p>
              )}
              <div className="space-y-4">
                {draftAddresses.map((address, i) => (
                  <fieldset key={i} className="rounded-2xl border border-line bg-ink-2 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="flabel" htmlFor={`addr-${i}-street`}>
                          Street address
                        </label>
                        <input
                          id={`addr-${i}-street`}
                          value={address.street}
                          onChange={(e) => updateDraftAddress(i, { street: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="flabel" htmlFor={`addr-${i}-city`}>
                          City
                        </label>
                        <input
                          id={`addr-${i}-city`}
                          value={address.city}
                          onChange={(e) => updateDraftAddress(i, { city: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="flabel" htmlFor={`addr-${i}-state`}>
                          State / Province
                        </label>
                        <input
                          id={`addr-${i}-state`}
                          value={address.state}
                          onChange={(e) => updateDraftAddress(i, { state: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="flabel" htmlFor={`addr-${i}-zip`}>
                          ZIP / Postal code
                        </label>
                        <input
                          id={`addr-${i}-zip`}
                          value={address.zipCode}
                          onChange={(e) => updateDraftAddress(i, { zipCode: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="flabel" htmlFor={`addr-${i}-country`}>
                          Country
                        </label>
                        <input
                          id={`addr-${i}-country`}
                          value={address.country}
                          onChange={(e) => updateDraftAddress(i, { country: e.target.value })}
                          className="input"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-muted">
                        <input
                          type="checkbox"
                          checked={address.isDefault}
                          onChange={(e) =>
                            setDraftAddresses((prev) =>
                              prev.map((a, j) => ({
                                ...a,
                                isDefault: e.target.checked ? j === i : a.isDefault && j !== i,
                              })),
                            )
                          }
                          className="chk"
                        />
                        Default address
                      </label>
                      <button
                        type="button"
                        onClick={() => setDraftAddresses((prev) => prev.filter((_, j) => j !== i))}
                        className="text-sm text-muted-2 transition hover:text-primary"
                      >
                        Remove
                      </button>
                    </div>
                  </fieldset>
                ))}
              </div>
              {addrError && (
                <p className="mt-4 text-sm text-primary" role="alert">
                  {addrError}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setDraftAddresses((prev) => [...prev, { ...emptyAddress }])}
                  className="btn btn--ghost"
                >
                  + Add Address
                </button>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => setAddrOpen(false)}
                  className="btn btn--ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={addrSaving} className="btn btn--primary disabled:opacity-60">
                  {addrSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Photo cropper (1:1 only) ─────────────────────────── */}
      <ImageCropper imageSrc={cropSrc} onClose={closeCrop} onConfirm={confirmCrop} />
    </div>
  );
}
