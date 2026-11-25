"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CatalogCategory } from "@/lib/api";
import { useShop } from "@/lib/store";

/**
 * The hodl header: a 34px status rail (store line left, contact
 * right, gradient hairline under it) over ONE sticky glass bar —
 * logo left, category nav as 13px uppercase heading-font links,
 * icon actions right. Search opens as a hairline row under the bar;
 * on small screens the categories ride a second scrollable row.
 * All destinations and the search submit are the store's own.
 */
export default function Header({
  storeName,
  logo,
  tagline,
  categories,
  contactEmail,
  phone,
}: {
  storeName: string;
  logo: string;
  tagline: string;
  categories: CatalogCategory[];
  contactEmail: string;
  phone: string;
}) {
  const { cartCount, wishlist, user } = useShop();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  // ALL top-level categories stay linked in the global navigation —
  // the old header linked every one; none may drop out of reach.
  const topCategories = categories.filter((c) => !c.parent);

  const iconBtn =
    "relative flex h-10 w-10 items-center justify-center text-muted transition hover:text-primary";
  const badge =
    "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white";
  const navLink =
    "flex h-10 items-center whitespace-nowrap px-2.5 font-display text-[13px] font-medium uppercase tracking-[0.09em] text-cream/75 transition hover:text-cream";

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(term.trim() ? `/shop?q=${encodeURIComponent(term.trim())}` : "/shop");
  };

  return (
    <>
      {/* Status rail */}
      <div className="relative hidden border-b border-line bg-ink md:block">
        <div className="wrap-x flex h-[34px] items-center justify-between gap-6 text-[12.5px] tracking-[0.02em] text-muted">
          <p className="truncate">{tagline || storeName}</p>
          <p className="flex shrink-0 items-center gap-5">
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="transition hover:text-primary">
                {contactEmail}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="transition hover:text-primary">
                {phone}
              </a>
            )}
          </p>
        </div>
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-[-1px] h-px opacity-70 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--sf-primary)_55%,transparent),color-mix(in_srgb,var(--sf-secondary)_40%,transparent),transparent)]"
        />
      </div>

      <header className="sticky top-0 z-40">
        <div className="border-b border-line bg-[color-mix(in_srgb,var(--sf-bg)_72%,transparent)] backdrop-blur-[18px] backdrop-saturate-[1.5]">
          <div className="wrap-x flex h-16 items-center gap-3 md:h-[76px] md:gap-5">
            <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${storeName} home`}>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={storeName} className="h-9 w-auto max-w-[220px] object-contain md:h-10" loading="lazy" />
              ) : (
                <span className="font-display text-[21px] font-semibold leading-none tracking-[-0.02em] text-cream">
                  {storeName}
                </span>
              )}
            </Link>

            <nav className="ml-2 hidden items-center xl:flex" aria-label="Categories">
              <Link href="/shop" className={navLink}>
                All Products
              </Link>
              {topCategories.map((category) => (
                <Link key={category._id} href={`/category/${category.slug}`} className={navLink}>
                  {category.name}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
              <button
                type="button"
                className={iconBtn}
                aria-label="Search products"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((v) => !v)}
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20.5 20.5-4.6-4.6" />
                </svg>
              </button>
              <Link
                href="/track-order"
                className="hidden h-10 items-center whitespace-nowrap px-2 font-display text-[13px] font-medium uppercase tracking-[0.09em] text-cream/75 transition hover:text-cream xl:flex"
              >
                Track Order
              </Link>
              <Link href="/wishlist" className={iconBtn} aria-label="Wishlist">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 20.5C7 16.5 3.5 13.2 3.5 9.6 3.5 7.2 5.3 5.5 7.6 5.5c1.7 0 3.4 1 4.4 2.6.9-1.6 2.7-2.6 4.4-2.6 2.3 0 4.1 1.7 4.1 4.1 0 3.6-3.5 6.9-8.5 10.9Z" />
                </svg>
                {wishlist.length > 0 && <span className={badge}>{wishlist.length}</span>}
              </Link>
              <Link href="/cart" className={iconBtn} aria-label="Cart">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5.5 8h15l-1.6 10.2a1.5 1.5 0 0 1-1.5 1.3H8.4a1.5 1.5 0 0 1-1.5-1.2L5.5 8Z" />
                  <path d="M8.8 10V6.8a3.2 3.2 0 0 1 6.4 0V10" />
                </svg>
                {cartCount > 0 && <span className={badge}>{cartCount}</span>}
              </Link>
              {user ? (
                <Link
                  href="/account"
                  className="ml-1 hidden h-10 items-center whitespace-nowrap px-2 font-display text-[13px] font-semibold uppercase tracking-[0.09em] text-cream transition hover:text-primary sm:flex"
                >
                  {user.firstName || "Account"}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="ml-1 hidden h-10 items-center whitespace-nowrap px-2 font-display text-[13px] font-semibold uppercase tracking-[0.09em] text-cream transition hover:text-primary sm:flex"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {searchOpen && (
            <div className="border-t border-line">
              <form className="wrap-x flex items-center gap-3 py-3" onSubmit={submitSearch} role="search">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="shrink-0 text-muted" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20.5 20.5-4.6-4.6" />
                </svg>
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  type="search"
                  name="q"
                  placeholder="Search products…"
                  aria-label="Search products"
                  autoFocus
                  className="w-full border-0 bg-transparent px-0 py-1.5 text-sm text-cream shadow-none placeholder:text-muted-2 focus:shadow-none"
                />
                <button type="submit" className="mono-label shrink-0 text-primary transition hover:text-cream">
                  Search
                </button>
              </form>
            </div>
          )}

          {/* Category row for small screens */}
          <nav className="border-t border-line xl:hidden" aria-label="Categories">
            <div className="no-scrollbar wrap-x flex items-center gap-2 overflow-x-auto py-1.5">
              <Link href="/shop" className={navLink}>
                All Products
              </Link>
              {topCategories.map((category) => (
                <Link key={category._id} href={`/category/${category.slug}`} className={navLink}>
                  {category.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
