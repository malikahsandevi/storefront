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

  return (
    <footer className="mt-16 border-t border-line bg-ink-2">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-extrabold text-cream">{name}</p>
          {config.tagline && <p className="mt-2 text-sm text-muted">{config.tagline}</p>}
          <p className="mt-3 text-sm leading-relaxed text-muted-2">
            Quality products, honest prices and delivery you can track — shop with confidence.
          </p>
        </div>

        <nav aria-label="Shop">
          <p className="text-sm font-bold uppercase tracking-wider text-cream">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link className="transition hover:text-cream" href="/shop">All Products</Link></li>
            {shopLinks.map((category) => (
              <li key={category._id}>
                <Link className="transition hover:text-cream" href={`/category/${category.slug}`}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Customer service">
          <p className="text-sm font-bold uppercase tracking-wider text-cream">Customer Service</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link className="transition hover:text-cream" href="/track-order">Track Your Order</Link></li>
            <li><Link className="transition hover:text-cream" href="/account">My Account</Link></li>
            <li><Link className="transition hover:text-cream" href="/account/orders">My Orders</Link></li>
            <li><Link className="transition hover:text-cream" href="/wishlist">Wishlist</Link></li>
            <li><Link className="transition hover:text-cream" href="/cart">Cart</Link></li>
          </ul>
        </nav>

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-cream">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {config.contactEmail && (
              <li>
                <a className="transition hover:text-cream" href={`mailto:${config.contactEmail}`}>
                  {config.contactEmail}
                </a>
              </li>
            )}
            {config.phone && (
              <li>
                <a className="transition hover:text-cream" href={`tel:${config.phone.replace(/\s+/g, "")}`}>
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
      <div className="border-t border-line/60 py-4 text-center text-xs text-muted-2">
        © <Year /> {name}. All rights reserved.
      </div>
    </footer>
  );
}
