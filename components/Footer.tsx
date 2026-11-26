import Link from "next/link";
import FooterAuthLinks from "./FooterAuthLinks";
import Year from "./Year";
import { storeDisplayName, type CatalogCategory, type StoreConfig } from "@/lib/api";
import { IconCheck, IconMail, IconPhone } from "./icons";

/**
 * The reference store's footer, rebuilt with our data: a brand
 * column (mark + name with a gradient span, the store's claim, its
 * trust ticks), three menu columns, a contact column, and a quiet
 * bottom bar with the legal line and the payment methods the store
 * actually takes (from config). No giant wordmark.
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
  const paymentNames = config.paymentMethods.map((m) => m.name).filter(Boolean);
  const nameParts = name.trim().split(/\s+/);

  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr__top">
          <div>
            <Link href="/" className="ftr__logo" aria-label={`${name} home`}>
              {config.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.logo} alt="" loading="lazy" />
              ) : null}
              <span className="ftr__name">
                {nameParts.length > 1 ? (
                  <>
                    {nameParts.slice(0, -1).join(" ")}{" "}
                    <span className="grad-text">{nameParts[nameParts.length - 1]}</span>
                  </>
                ) : (
                  name
                )}
              </span>
            </Link>
            {config.tagline && <p className="ftr__claim">{config.tagline}</p>}
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-2">
              Quality products, honest prices and delivery you can track — shop with confidence.
            </p>
            <ul className="ftr__ticks">
              <li>
                <IconCheck /> Order tracking on every purchase
              </li>
              <li>
                <IconCheck /> Transparent pricing, confirmed at checkout
              </li>
            </ul>
          </div>

          <div className="ftr__menues">
            <nav className="ftr__col" aria-label="Shop">
              <p className="ftr__titel">Shop</p>
              <ul>
                <li><Link href="/shop">All Products</Link></li>
                {shopLinks.map((category) => (
                  <li key={category._id}>
                    <Link href={`/category/${category.slug}`}>{category.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav className="ftr__col" aria-label="Customer service">
              <p className="ftr__titel">Customer Service</p>
              <ul>
                <li><Link href="/track-order">Track Your Order</Link></li>
                <li><Link href="/account">My Account</Link></li>
                <li><Link href="/account/orders">My Orders</Link></li>
                <li><Link href="/wishlist">Wishlist</Link></li>
                <li><Link href="/cart">Cart</Link></li>
              </ul>
            </nav>
            <nav className="ftr__col" aria-label="Account">
              <p className="ftr__titel">Account</p>
              <ul>
                <FooterAuthLinks />
                <li><Link href="/account">My Account</Link></li>
                <li><Link href="/account/orders">My Orders</Link></li>
                <li><Link href="/wishlist">Wishlist</Link></li>
              </ul>
            </nav>
          </div>

          <div>
            <p className="ftr__titel">Contact</p>
            <p className="ftr__text">
              Questions about a product or an order? Reach the store directly — no ticket system.
            </p>
            {config.contactEmail && (
              <a className="ftr__contact-link" href={`mailto:${config.contactEmail}`}>
                <IconMail /> {config.contactEmail}
              </a>
            )}
            {config.phone && (
              <a className="ftr__contact-link" href={`tel:${config.phone.replace(/\s+/g, "")}`}>
                <IconPhone /> {config.phone}
              </a>
            )}
            {!config.contactEmail && !config.phone && (
              <p className="ftr__text">Reach us any time from your account page.</p>
            )}
            <Link href="/track-order" className="vlink mt-4">
              Track your order <span className="arr" aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="ftr__boden">
          <p>
            © <Year /> {name}. All rights reserved.
          </p>
          {paymentNames.length > 0 && <p>Pay with {paymentNames.join(" · ")}</p>}
        </div>
      </div>
    </footer>
  );
}
