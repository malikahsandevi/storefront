"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CatalogCategory } from "@/lib/api";
import { useShop } from "@/lib/store";

export default function Header({
  storeName,
  logo,
  tagline,
  categories,
}: {
  storeName: string;
  logo: string;
  tagline: string;
  categories: CatalogCategory[];
}) {
  const { cartCount, wishlist, user } = useShop();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const topCategories = categories.filter((c) => !c.parent).slice(0, 8);

  const iconBtn =
    "relative flex h-10 w-10 items-center justify-center text-xl text-muted transition hover:text-primary";
  const badge =
    "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white";

  const tickerItems = [
    tagline || storeName,
    ...topCategories.slice(0, 5).map((c) => c.name),
    "Order tracking on every purchase",
  ].filter(Boolean);

  return (
    <>
      {/* Editorial ticker — the store's own lines, on loop (GSAP). */}
      <div aria-hidden className="overflow-hidden bg-primary py-2 text-white">
        <div data-marquee-track className="flex w-max items-center gap-8 pr-8">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-8">
              {tickerItems.map((item, i) => (
                <span
                  key={`${copy}-${i}`}
                  className="flex items-center gap-8 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.22em]"
                >
                  {item}
                  <span aria-hidden className="text-[9px]">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b-2 border-cream/80 bg-ink/95 backdrop-blur-md">
        {/* Masthead */}
        <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-4 px-4 py-5 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
          <form
            className="hidden max-w-xs items-end gap-2 md:flex"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(term.trim() ? `/shop?q=${encodeURIComponent(term.trim())}` : "/shop");
            }}
            role="search"
          >
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              type="search"
              name="q"
              placeholder="Search products…"
              aria-label="Search products"
              className="w-full border-0 border-b border-line bg-transparent px-1 py-2 text-sm text-cream shadow-none placeholder:text-muted-2 focus:shadow-none"
            />
            <button
              type="submit"
              className="pb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary transition hover:text-cream"
            >
              Search
            </button>
          </form>

          <Link
            href="/"
            className="flex items-center gap-2 justify-self-start md:justify-self-center"
            aria-label={`${storeName} home`}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={storeName} className="h-10 w-auto max-w-44 object-contain" loading="lazy" />
            ) : (
              <span className="font-display text-[1.7rem] font-black uppercase leading-none tracking-tight text-cream">
                {storeName}
              </span>
            )}
          </Link>

          <nav className="flex items-center gap-1 justify-self-end sm:gap-2" aria-label="Account and cart">
            <Link
              href="/track-order"
              className="hidden px-2 py-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted transition hover:text-primary lg:block"
            >
              Track Order
            </Link>
            <Link href="/wishlist" className={iconBtn} aria-label="Wishlist">
              <span aria-hidden>♥</span>
              {wishlist.length > 0 && <span className={badge}>{wishlist.length}</span>}
            </Link>
            <Link href="/cart" className={iconBtn} aria-label="Cart">
              <span aria-hidden>🛒</span>
              {cartCount > 0 && <span className={badge}>{cartCount}</span>}
            </Link>
            {user ? (
              <Link
                href="/account"
                className="ml-2 border-b-2 border-primary pb-0.5 text-[13px] font-bold uppercase tracking-[0.08em] text-cream transition hover:text-primary"
              >
                {user.firstName || "Account"}
              </Link>
            ) : (
              <Link
                href="/login"
                className="ml-2 border-b-2 border-primary pb-0.5 text-[13px] font-bold uppercase tracking-[0.08em] text-cream transition hover:text-primary"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>

        {/* Category nav */}
        <nav className="border-t border-line" aria-label="Categories">
          <div className="no-scrollbar mx-auto flex max-w-7xl items-center justify-start gap-7 overflow-x-auto px-4 py-3 sm:px-6 md:justify-center lg:px-8">
            <Link
              href="/shop"
              className="whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.1em] text-cream underline-offset-4 transition hover:text-primary hover:underline"
            >
              All Products
            </Link>
            {topCategories.map((category) => (
              <Link
                key={category._id}
                href={`/category/${category.slug}`}
                className="whitespace-nowrap text-[13px] font-medium uppercase tracking-[0.1em] text-muted underline-offset-4 transition hover:text-cream hover:underline"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
