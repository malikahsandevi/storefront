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
  const headingCls = "text-[11px] font-bold uppercase tracking-[0.18em] text-muted-2";
  const linkCls = "transition hover:text-cream";

  return (
    <footer className="mt-24 bg-ink-2">
      <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-[1.4rem] font-extrabold leading-none tracking-tighter text-cream">{name}</p>
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
      <div className="border-t border-line/50 py-5 text-center text-xs text-muted-2">
        © <Year /> {name}. All rights reserved.
      </div>
    </footer>
  );
}
