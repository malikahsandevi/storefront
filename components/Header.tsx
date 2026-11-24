"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CatalogCategory } from "@/lib/api";
import { useShop } from "@/lib/store";

export default function Header({
  storeName,
  logo,
  categories,
}: {
  storeName: string;
  logo: string;
  categories: CatalogCategory[];
}) {
  const { cartCount, wishlist, user } = useShop();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const topCategories = categories.filter((c) => !c.parent).slice(0, 8);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${storeName} home`}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={storeName} className="h-9 w-auto max-w-40 object-contain" loading="lazy" />
          ) : (
            <span className="text-xl font-extrabold tracking-tight text-cream">
              {storeName}
            </span>
          )}
        </Link>

        <form
          className="hidden flex-1 md:flex"
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
            className="w-full rounded-l-full border border-line bg-surface px-4 py-2 text-sm text-cream placeholder:text-muted-2"
          />
          <button
            type="submit"
            className="rounded-r-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Search
          </button>
        </form>

        <nav className="ml-auto flex items-center gap-1 text-sm sm:gap-2" aria-label="Account and cart">
          <Link href="/track-order" className="hidden px-2 py-1 text-muted transition hover:text-cream lg:block">
            Track Order
          </Link>
          <Link href="/wishlist" className="relative px-2 py-1 text-muted transition hover:text-cream" aria-label="Wishlist">
            <span aria-hidden>♥</span>
            {wishlist.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative px-2 py-1 text-muted transition hover:text-cream" aria-label="Cart">
            <span aria-hidden>🛒</span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <Link href="/account" className="rounded-full bg-surface px-3 py-1.5 font-medium text-cream transition hover:bg-surface-2">
              {user.firstName || "Account"}
            </Link>
          ) : (
            <Link href="/login" className="rounded-full bg-surface px-3 py-1.5 font-medium text-cream transition hover:bg-surface-2">
              Sign In
            </Link>
          )}
        </nav>
      </div>

      <nav className="border-t border-line/60" aria-label="Categories">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 text-sm">
          <Link href="/shop" className="whitespace-nowrap rounded-full px-3 py-1 font-medium text-cream transition hover:bg-surface">
            All Products
          </Link>
          {topCategories.map((category) => (
            <Link
              key={category._id}
              href={`/category/${category.slug}`}
              className="whitespace-nowrap rounded-full px-3 py-1 text-muted transition hover:bg-surface hover:text-cream"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
