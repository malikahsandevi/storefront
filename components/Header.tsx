"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { formatMoney, type CatalogCategory, type CatalogProduct } from "@/lib/api";
import { useShop } from "@/lib/store";
import { useCartUI } from "./CartDrawer";
import { IconArrow, IconBag, IconHeart, IconSearch, IconUser } from "./icons";

/**
 * The store's header: ONE sticky glass bar (76px) — wordmark
 * left, the category navigation inside a PILL that grows to fill
 * the bar, and on the right a search pill (with the ⌘K chip) and
 * circular icon actions with count bubbles. The cart icon opens
 * the cart drawer; search opens a glass panel under the bar; on
 * small screens a burger opens the numbered link panel.
 * All destinations, the search submit and the badges are the
 * store's own wiring. ALL top-level categories stay in the nav.
 */
export default function Header({
  storeName,
  logo,
  categories,
  featured,
  currency,
}: {
  storeName: string;
  logo: string;
  tagline: string;
  categories: CatalogCategory[];
  /** One real product per main category that has subcategories —
   *  the hover mega panel's featured card (server-fetched). */
  featured: Record<string, CatalogProduct>;
  currency: string;
  contactEmail: string;
  phone: string;
}) {
  const { cartCount, wishlist, user } = useShop();
  const { setOpen: setCartOpen } = useCartUI();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [panel, setPanel] = useState<"none" | "search" | "menu">("none");
  // The hover mega panel's category (desktop nav) — null when shut.
  const [mega, setMega] = useState<string | null>(null);
  const topCategories = categories.filter((c) => !c.parent);
  const subsOf = (id: string) =>
    categories.filter((c) => c.parent && String(c.parent._id) === String(id));
  const megaCategory = mega
    ? topCategories.find((c) => String(c._id) === mega) || null
    : null;
  const megaSubs = megaCategory ? subsOf(megaCategory._id) : [];
  const megaIndex = megaCategory
    ? topCategories.findIndex((c) => String(c._id) === String(megaCategory._id))
    : -1;
  const megaProduct = megaCategory ? featured[String(megaCategory._id)] : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPanel((p) => (p === "search" ? "none" : "search"));
      }
      if (e.key === "Escape") {
        setPanel("none");
        setMega(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // The mega panel and the click panels never stack: opening search
  // or the menu shuts the hover panel.
  useEffect(() => {
    if (panel !== "none") setMega(null);
  }, [panel]);

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

  const tailLinks: { href: string; label: string }[] = [
    { href: "/wishlist", label: "Wishlist" },
    { href: user ? "/account" : "/login", label: user ? "My Account" : "Sign In" },
  ];

  // Mobile menu rows: main entries keep the panel's sequential
  // numbering; subcategories ride directly under their main category
  // as indented rows (no hover on touch — they must be reachable).
  const menuRows = (() => {
    let n = 0;
    const main = (href: string, label: string) => ({
      href,
      label,
      sub: false,
      idx: String(++n).padStart(2, "0"),
      depth: 0,
    });
    const sub = (href: string, label: string, depth: number) => ({
      href,
      label,
      sub: true,
      idx: "–",
      depth,
    });
    // Recursive walk: every descendant sits under its main category
    // as an indented row, so deeper levels stay reachable without
    // hover (each extra level indents further at render).
    const walkSubs = (parentId: string, depth: number): ReturnType<typeof sub>[] =>
      subsOf(parentId).flatMap((s) => [
        sub(`/category/${s.slug}`, s.name, depth),
        ...walkSubs(s._id, depth + 1),
      ]);
    return [
      main("/shop", "All Products"),
      ...topCategories.flatMap((category) => [
        main(`/category/${category.slug}`, category.name),
        ...walkSubs(category._id, 1),
      ]),
      ...tailLinks.map((link) => main(link.href, link.label)),
    ];
  })();

  return (
    <div className="hdr">
      {/* Main bar — leaving the bar (nav + any open panel together)
          shuts the hover mega panel. */}
      <header className="hdr__bar" onMouseLeave={() => setMega(null)}>
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
              <li onMouseEnter={() => setMega(null)}>
                <Link href="/shop" className="hdr__nav-link">
                  All Products
                </Link>
              </li>
              {topCategories.map((category) => {
                const subs = subsOf(category._id);
                return (
                  <li
                    key={category._id}
                    onMouseEnter={() => {
                      if (panel === "none") {
                        setMega(subs.length ? String(category._id) : null);
                      }
                    }}
                  >
                    <Link
                      href={`/category/${category.slug}`}
                      className="hdr__nav-link"
                      aria-haspopup={subs.length ? "true" : undefined}
                      aria-expanded={
                        subs.length ? mega === String(category._id) : undefined
                      }
                    >
                      {category.name}
                    </Link>
                  </li>
                );
              })}
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
            <Link href="/wishlist" className="hdr__icon" aria-label="Wishlist">
              <IconHeart />
              {wishlist.length > 0 && <span className="hdr__bubble">{wishlist.length}</span>}
            </Link>
            <Link href={user ? "/account" : "/login"} className="hdr__icon" aria-label={user ? "My account" : "Sign in"}>
              <IconUser />
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

        {/* Hover mega panel (desktop): the reference store's
            composition — the category's index, name and description
            with a View All link on the left, its subcategories as a
            numbered list in the middle, and one featured product of
            the category on the right. Only categories WITH
            subcategories open it; it lives inside the bar, so moving
            from the nav down into the panel keeps it open and
            leaving the bar shuts it. */}
        {megaCategory && panel === "none" && (
          <div className="hdr__panel hdr__mega">
            <div className="hdr__panel-card">
              <div className="hdr__mega-grid">
                <div className="hdr__mega-intro">
                  <p className="hdr__mega-idx" aria-hidden>
                    {String(megaIndex + 1).padStart(2, "0")}
                  </p>
                  <h3 className="hdr__mega-title">{megaCategory.name}</h3>
                  {megaCategory.description && (
                    <p className="hdr__mega-desc">{megaCategory.description}</p>
                  )}
                  <Link
                    href={`/category/${megaCategory.slug}`}
                    className="hdr__mega-all"
                    onClick={() => setMega(null)}
                  >
                    View All {megaCategory.name}
                    <IconArrow className="h-4 w-4" />
                  </Link>
                </div>
                <nav
                  className="hdr__mega-subs"
                  aria-label={`${megaCategory.name} subcategories`}
                >
                  {megaSubs.map((sub, i) => (
                    <Link
                      key={sub._id}
                      href={`/category/${sub.slug}`}
                      onClick={() => setMega(null)}
                    >
                      <span className="idx" aria-hidden>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{sub.name}</span>
                    </Link>
                  ))}
                </nav>
                {megaProduct && (
                  <Link
                    href={`/product/${megaProduct.slug}`}
                    className="hdr__mega-feat"
                    onClick={() => setMega(null)}
                  >
                    <span className="hdr__mega-feat-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          megaProduct.image ||
                          megaProduct.images?.find((img) => img.isMain)?.url ||
                          megaProduct.images?.[0]?.url ||
                          ""
                        }
                        alt={megaProduct.name}
                        loading="lazy"
                      />
                    </span>
                    {(megaProduct.brand?.name || megaProduct.category?.name) && (
                      <span className="hdr__mega-feat-tag">
                        {megaProduct.brand?.name || megaProduct.category?.name}
                      </span>
                    )}
                    <span className="hdr__mega-feat-name">{megaProduct.name}</span>
                    <span className="hdr__mega-feat-price">
                      {formatMoney(megaProduct.price, currency)}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu panel */}
        {panel === "menu" && (
          <div className="hdr__panel">
            <div className="hdr__panel-card">
              <nav className="hdr__mobile-links" aria-label="Menu">
                {menuRows.map((row) => (
                  <Link
                    key={row.href}
                    href={row.href}
                    className={row.sub ? "hdr__mobile-sublink" : undefined}
                    style={
                      row.sub && row.depth > 1
                        ? { paddingLeft: 46 + (row.depth - 1) * 20 }
                        : undefined
                    }
                    onClick={() => setPanel("none")}
                  >
                    <span className="idx" aria-hidden>{row.idx}</span>
                    <span>{row.label}</span>
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
