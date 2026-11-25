import Link from "next/link";
import Year from "./Year";
import { storeDisplayName, type CatalogCategory, type StoreConfig } from "@/lib/api";

/**
 * The hodl vault footer: quiet and structured — a brand column with
 * the store's claim and its real trust ticks, menu columns, a contact
 * column, and a bottom bar with the legal line and the payment
 * methods the store actually takes (from config). No giant wordmark.
 */
export default function Footer({
  config,
  categories,
}: {
  config: StoreConfig;
  categories: CatalogCategory[];
}) {
  const name = storeDisplayName(config);
  const shopLinks = categories.filter((c) => !c.parent).slice(0, 6);
  const headingCls = "mono-label text-muted-2";
  const linkCls = "transition hover:text-primary";
  const paymentNames = config.paymentMethods.map((m) => m.name).filter(Boolean);

  return (
    <footer className="mt-24 border-t border-line bg-ink-2">
      <div className="wrap-x pb-9 pt-[72px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_2fr_1.2fr]">
          <div>
            <p className="font-display text-xl font-black uppercase tracking-tight text-cream">{name}</p>
            {config.tagline && (
              <p className="mt-3 max-w-[30ch] font-display text-[17px] font-medium leading-snug text-cream">
                {config.tagline}
              </p>
            )}
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-2">
              Quality products, honest prices and delivery you can track — shop with confidence.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <span aria-hidden className="font-bold text-primary">✓</span> Order tracking on every purchase
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="font-bold text-primary">✓</span> Transparent pricing, confirmed at checkout
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-10">
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
          </div>

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
      <div className="border-t border-line">
        <div className="wrap-x flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-muted-2">
          <p>
            © <Year /> {name}. All rights reserved.
          </p>
          {paymentNames.length > 0 && <p>Pay with {paymentNames.join(" · ")}</p>}
        </div>
      </div>
    </footer>
  );
}
