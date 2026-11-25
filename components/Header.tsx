"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CatalogCategory } from "@/lib/api";
import { useShop } from "@/lib/store";
import { useCartUI } from "./CartDrawer";
import { IconArrow, IconBag, IconBox, IconHeart, IconMail, IconPhone, IconSearch, IconUser } from "./icons";

/**
 * The reference store's header, rebuilt with our data:
 *  - a 34px status rail (pulsing dot + store line left, contact
 *    right, gradient hairline under it) that scrolls away;
 *  - ONE sticky glass bar (76px): wordmark left, the category
 *    navigation inside a centred PILL, and on the right a search
 *    pill (with the ⌘K chip), a gradient CTA, and circular icon
 *    actions with count bubbles. The cart icon opens the cart
 *    drawer; search opens a glass panel under the bar; on small
 *    screens a burger opens the numbered link panel.
 * All destinations, the search submit and the badges are the
 * store's own wiring. ALL top-level categories stay in the nav.
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
  const { setOpen: setCartOpen } = useCartUI();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [panel, setPanel] = useState<"none" | "search" | "menu">("none");
  const topCategories = categories.filter((c) => !c.parent);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPanel((p) => (p === "search" ? "none" : "search"));
      }
      if (e.key === "Escape") setPanel("none");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPanel("none");
    router.push(term.trim() ? `/shop?q=${encodeURIComponent(term.trim())}` : "/shop");
  };

  const nameParts = storeName.trim().split(/\s+/);
  const wordmark =
    nameParts.length > 1 ? (
      <>
        {nameParts.slice(0, -1).join(" ")}{" "}
        <span className="grad-text">{nameParts[nameParts.length - 1]}</span>
      </>
    ) : (
      storeName
    );

  const menuLinks: { href: string; label: string }[] = [
    { href: "/shop", label: "All Products" },
    ...topCategories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
    { href: "/track-order", label: "Track Order" },
    { href: "/wishlist", label: "Wishlist" },
    { href: user ? "/account" : "/login", label: user ? "My Account" : "Sign In" },
  ];

  return (
    <div className="hdr">
      {/* Status rail */}
      <div className="hdr__rail">
        <div className="hwrap hdr__rail-in">
          <p className="hdr__rail-status">
            <span className="dot" aria-hidden />
            <span>{tagline || storeName}</span>
          </p>
          <p className="hdr__rail-contact">
            <Link href="/track-order">
              <IconBox /> Track Order
            </Link>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`}>
                <IconMail /> {contactEmail}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/\s+/g, "")}`}>
                <IconPhone /> {phone}
              </a>
            )}
          </p>
        </div>
      </div>

      {/* Main bar */}
      <header className="hdr__bar">
        <div className="hwrap hdr__bar-in">
          <button
            type="button"
            className="hdr__burger"
            aria-label="Menu"
            aria-expanded={panel === "menu"}
            onClick={() => setPanel((p) => (p === "menu" ? "none" : "menu"))}
          >
            <span aria-hidden />
            <span aria-hidden />
          </button>

          <Link href="/" className="hdr__logo" aria-label={`${storeName} home`}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={storeName} loading="lazy" />
            ) : (
              <span className="hdr__wordmark">{wordmark}</span>
            )}
          </Link>

          <nav className="hdr__nav" aria-label="Categories">
            <ul className="hdr__nav-list no-scrollbar">
              <li>
                <Link href="/shop" className="hdr__nav-link">
                  All Products
                </Link>
              </li>
              {topCategories.map((category) => (
                <li key={category._id}>
                  <Link href={`/category/${category.slug}`} className="hdr__nav-link">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hdr__actions">
            <button
              type="button"
              className="hdr__search"
              aria-label="Search products"
              aria-expanded={panel === "search"}
              onClick={() => setPanel((p) => (p === "search" ? "none" : "search"))}
            >
              <IconSearch />
              <span className="hdr__search-label">Search</span>
              <span className="hdr__kbd" aria-hidden>⌘K</span>
            </button>
            <Link href="/shop" className="btn btn--primary hdr__cta">
              Shop Now <IconArrow className="arr h-4 w-4" />
            </Link>
            <Link
              href="/track-order"
              className="hidden h-10 items-center whitespace-nowrap px-2 font-display text-[13px] font-medium uppercase tracking-[0.09em] text-cream/75 transition hover:text-cream xl:flex"
            >
              Track Order
            </Link>
            <Link href="/wishlist" className="hdr__icon" aria-label="Wishlist">
              <IconHeart />
              {wishlist.length > 0 && <span className="hdr__bubble">{wishlist.length}</span>}
            </Link>
            <Link href={user ? "/account" : "/login"} className="hdr__icon" aria-label={user ? "My account" : "Sign in"}>
              <IconUser />
            </Link>
            <Link
              href={user ? "/account" : "/login"}
              className="ml-1 hidden h-10 items-center whitespace-nowrap px-2 font-display text-[13px] font-semibold uppercase tracking-[0.09em] text-cream transition hover:text-primary sm:flex"
            >
              {user ? user.firstName || "Account" : "Sign In"}
            </Link>
            <button type="button" className="hdr__icon" aria-label="Cart" onClick={() => setCartOpen(true)}>
              <IconBag />
              {cartCount > 0 && <span className="hdr__bubble">{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* Search panel */}
        {panel === "search" && (
          <div className="hdr__panel">
            <div className="hdr__panel-card">
              <form className="flex items-center gap-3 px-6 py-5" onSubmit={submitSearch} role="search">
                <IconSearch className="h-5 w-5 shrink-0 text-muted" />
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  type="search"
                  name="q"
                  placeholder="Search products…"
                  aria-label="Search products"
                  autoFocus
                  className="w-full border-0 bg-transparent text-base text-cream shadow-none outline-none placeholder:text-muted-2 focus:shadow-none"
                />
                <button type="submit" className="btn btn--primary btn--sm shrink-0">
                  Search
                </button>
              </form>
              {topCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-4">
                  <span className="mono-label mr-1 text-muted-2">Browse</span>
                  {topCategories.slice(0, 6).map((category) => (
                    <Link
                      key={category._id}
                      href={`/category/${category.slug}`}
                      className="chip transition hover:border-primary"
                      onClick={() => setPanel("none")}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile menu panel */}
        {panel === "menu" && (
          <div className="hdr__panel">
            <div className="hdr__panel-card">
              <nav className="hdr__mobile-links" aria-label="Menu">
                {menuLinks.map((link, i) => (
                  <Link key={link.href} href={link.href} onClick={() => setPanel("none")}>
                    <span className="idx" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                    <span>{link.label}</span>
                    <IconArrow className="h-4 w-4 text-primary" />
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
