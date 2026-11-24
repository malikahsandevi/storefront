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

  const iconBtn =
    "relative flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-lg text-muted transition hover:border-line/70 hover:bg-surface hover:text-cream";
  const badge =
    "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-glow";

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:gap-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${storeName} home`}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={storeName} className="h-9 w-auto max-w-40 object-contain" loading="lazy" />
          ) : (
            <span className="text-[1.4rem] font-extrabold leading-none tracking-tighter text-cream">
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
            className="w-full rounded-l-full border border-line/70 bg-surface/70 px-5 py-2.5 text-sm text-cream placeholder:text-muted-2"
          />
          <button
            type="submit"
            className="rounded-r-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-glow transition hover:bg-primary-dark active:scale-[0.98]"
          >
            Search
          </button>
        </form>

        <nav className="ml-auto flex items-center gap-1 sm:gap-1.5" aria-label="Account and cart">
          <Link href="/track-order" className="hidden px-2 py-1 text-sm font-medium text-muted transition hover:text-cream lg:block">
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
            <Link href="/account" className="ml-1 rounded-full border border-line/70 bg-surface/70 px-4 py-2 text-sm font-semibold text-cream transition hover:border-primary/60 hover:bg-surface">
              {user.firstName || "Account"}
            </Link>
          ) : (
            <Link href="/login" className="ml-1 rounded-full border border-line/70 bg-surface/70 px-4 py-2 text-sm font-semibold text-cream transition hover:border-primary/60 hover:bg-surface">
              Sign In
            </Link>
          )}
        </nav>
      </div>

      <nav className="border-t border-line/40" aria-label="Categories">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
          <Link href="/shop" className="whitespace-nowrap rounded-full border border-line/60 bg-surface/80 px-3.5 py-1.5 text-[13px] font-semibold text-cream transition hover:border-primary/50">
            All Products
          </Link>
          {topCategories.map((category) => (
            <Link
              key={category._id}
              href={`/category/${category.slug}`}
              className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium text-muted transition hover:bg-surface/70 hover:text-cream"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
