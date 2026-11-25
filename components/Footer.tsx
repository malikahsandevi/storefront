import Link from "next/link";
import Year from "./Year";
import { storeDisplayName, type CatalogCategory, type StoreConfig } from "@/lib/api";

export default function Footer({
  config,
  categories,
}: {
  config: StoreConfig;
  categories: CatalogCategory[];
}) {
  const name = storeDisplayName(config);
  const shopLinks = categories.filter((c) => !c.parent).slice(0, 6);
  const headingCls = "text-[11px] font-bold uppercase tracking-[0.22em] text-muted-2";
  const linkCls = "transition hover:text-primary";

  return (
    <footer className="mt-24 border-t-2 border-cream/80 bg-ink-2">
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
        <p
          aria-hidden
          className="select-none overflow-hidden whitespace-nowrap font-display text-[13.5vw] font-black uppercase leading-[0.85] tracking-tight text-surface-2 lg:text-[10.5rem]"
        >
          {name}
        </p>

        <div className="grid gap-10 border-t border-line py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl font-black uppercase tracking-tight text-cream">{name}</p>
            {config.tagline && <p className="mt-3 text-sm text-muted">{config.tagline}</p>}
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-2">
              Quality products, honest prices and delivery you can track — shop with confidence.
            </p>
          </div>

          <nav aria-label="Shop">
            <p className={headingCls}>Shop</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><Link className={linkCls} href="/shop">All Products</Link></li>
              {shopLinks.map((category) => (
                <li key={category._id}>
                  <Link className={linkCls} href={`/category/${category.slug}`}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Customer service">
            <p className={headingCls}>Customer Service</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><Link className={linkCls} href="/track-order">Track Your Order</Link></li>
              <li><Link className={linkCls} href="/account">My Account</Link></li>
              <li><Link className={linkCls} href="/account/orders">My Orders</Link></li>
              <li><Link className={linkCls} href="/wishlist">Wishlist</Link></li>
              <li><Link className={linkCls} href="/cart">Cart</Link></li>
            </ul>
          </nav>

          <div>
            <p className={headingCls}>Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {config.contactEmail && (
                <li>
                  <a className={linkCls} href={`mailto:${config.contactEmail}`}>
                    {config.contactEmail}
                  </a>
                </li>
              )}
              {config.phone && (
                <li>
                  <a className={linkCls} href={`tel:${config.phone.replace(/\s+/g, "")}`}>
                    {config.phone}
                  </a>
                </li>
              )}
              {!config.contactEmail && !config.phone && (
                <li className="text-muted-2">Reach us any time from your account page.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted-2">
        © <Year /> {name}. All rights reserved.
      </div>
    </footer>
  );
}
