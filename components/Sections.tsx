import Link from "next/link";
import type { CatalogCategory, StoreConfig } from "@/lib/api";
import SectionHead from "./SectionHead";
import { IconArrow, IconChat, IconCheck, IconShield } from "./icons";

/**
 * Shared page sections in the reference store's composition,
 * filled only with this store's real data (config + catalog).
 * Used by Home, Shop, Category and Product so the whole site
 * speaks one design language.
 */

export function Ticks({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`ticks ${className}`}>
      {items.map((item) => (
        <li key={item}>
          <IconCheck /> {item}
        </li>
      ))}
    </ul>
  );
}

/** The ticker band under the hero: a labelled marquee lane of
 *  category links, and a second lane of store facts. */
export function FactsTicker({
  categories,
  facts,
}: {
  categories: CatalogCategory[];
  facts: string[];
}) {
  const tops = categories.filter((c) => !c.parent);
  const lane = (items: React.ReactNode[], key: string, rev = false) => (
    <div className={`tick__lane${rev ? " tick__lane--rev" : ""}`} key={key}>
      {[0, 1].map((copy) => (
        <div className="tick__track" key={copy} aria-hidden={copy === 1}>
          {items}
        </div>
      ))}
    </div>
  );
  return (
    <div className="tick" aria-label="Store facts">
      {tops.length > 0 && (
        <div className="tick__row">
          <p className="tick__label">
            <i aria-hidden /> Categories
          </p>
          {lane(
            tops.map((c) => (
              <Link key={c._id} href={`/category/${c.slug}`} className="tick__fact">
                {c.name}
              </Link>
            )),
            "cats",
          )}
        </div>
      )}
      <div className="tick__row">
        <p className="tick__label">
          <i aria-hidden /> Store Facts
        </p>
        {lane(
          facts.map((fact) => (
            <span key={fact} className="tick__fact">
              {fact}
            </span>
          )),
          "facts",
          true,
        )}
      </div>
    </div>
  );
}

const STEPS = [
  {
    hash: "Step 01 · Catalog",
    title: "Browse & choose",
    text: "Browse the catalog and pick your product — every price and stock count you see is the store's real, live figure.",
    href: "/shop",
    link: "Browse the shop",
  },
  {
    hash: "Step 02 · Checkout",
    title: "Check out securely",
    text: "Your total is priced by the store's server at checkout — shipping and coupons included, nothing added later.",
    href: "/cart",
    link: "See your cart",
  },
  {
    hash: "Step 03 · Delivery",
    title: "Track your delivery",
    text: "Every order gets a number. Sign in and follow it any time with that number.",
    href: "/track-order",
    link: "Track an order",
  },
];

/** The three-link chain section (numbered hexagon nodes on a
 *  gradient rail, media cards under each). */
export function StepsSection({ no, images }: { no: string; images: (string | null)[] }) {
  return (
    <section className="sec sec--flat sec--line" aria-label="How ordering works">
      <div className="wrap">
        <SectionHead
          no={no}
          label="How ordering works"
          title={
            <>
              Ordering is a chain. <strong>Here are all three links.</strong>
            </>
          }
          lead="From the first click to your door: choose your product, check out with a server-confirmed total, and track the delivery with your order number."
        />
        <div className="chain__track">
          <div className="chain__rail" aria-hidden>
            <span />
          </div>
          <ol className="chain__list">
            {STEPS.map((step, i) => (
              <li key={step.title} className="chain__step" data-reveal>
                <div className="chain__node" aria-hidden>
                  <span className="chain__hex" />
                  <span className="node-num">{i + 1}</span>
                </div>
                <p className="chain__hash">{step.hash}</p>
                <div className="chain__card">
                  {images[i] && (
                    <div className="chain__media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={images[i] as string} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="chain__body">
                    <h3 className="chain__title">{step.title}</h3>
                    <p className="chain__text">{step.text}</p>
                    <Link href={step.href} className="vlink">
                      {step.link} <IconArrow className="arr h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="chain__note">
          A chain is only as strong as its weakest link — so all three stay visible to you, from
          the catalog to the courier.
        </p>
      </div>
    </section>
  );
}

/** The verify ledger: store claims as numbered rows, each with a
 *  place to check it — the reference store's trust pattern. */
export function VerifyLedger({
  no,
  config,
  totalProducts,
  categoryCount,
}: {
  no: string;
  config: StoreConfig;
  totalProducts: number;
  categoryCount: number;
}) {
  const paymentNames = config.paymentMethods.map((m) => m.name).filter(Boolean);
  const rows: { label: string; value: string; href: string; action: string }[] = [
    {
      label: "Order tracking",
      value: "Every order can be tracked from your account with its order number — sign in and it is looked up with your own email.",
      href: "/track-order",
      action: "Track an order",
    },
    {
      label: "Payment methods",
      value: paymentNames.length
        ? `The store takes ${paymentNames.join(", ")}. The list comes straight from the store's own settings.`
        : "Cash on Delivery is available on every order.",
      href: "/checkout",
      action: "See checkout",
    },
    {
      label: "Honest totals",
      value: "Totals are recomputed by the store's server when you check out — the total you see is the total you pay.",
      href: "/shop",
      action: "Browse the shop",
    },
    {
      label: "Live catalog",
      value: `${totalProducts} products across ${categoryCount} categories, served from the store's live inventory — drafts and deleted items never appear.`,
      href: "/shop",
      action: "Open the catalog",
    },
    {
      label: "Direct contact",
      value: [config.contactEmail, config.phone].filter(Boolean).join(" · ") ||
        "Reach the store any time from your account page.",
      href: config.contactEmail ? `mailto:${config.contactEmail}` : "/account",
      action: "Contact the store",
    },
  ];
  return (
    <section className="sec sec--line" aria-label="Store facts you can check">
      <div className="wrap">
        <SectionHead
          no={no}
          label="Trust, verified"
          title={
            <>
              Don&rsquo;t take our word for it. <strong>Check it yourself.</strong>
            </>
          }
          lead="Every claim below points at a page where you can verify it — the catalog, the tracker and the checkout all run on the same live data."
        />
        <div className="ledg__box" data-reveal>
          <div className="ledg__top">
            <span>Store facts</span>
            <span>
              <b className="text-primary">{rows.length} entries</b> · live from the catalog
            </span>
          </div>
          <ol className="ledg__rows">
            {rows.map((row, i) => (
              <li key={row.label} className="ledg__row">
                <span className="ledg__blk">{String(i + 1).padStart(2, "0")}</span>
                <span className="ledg__label">
                  <IconShield /> {row.label}
                </span>
                <span className="ledg__val">{row.value}</span>
                <span className="ledg__act">
                  <Link href={row.href} className="ledg__check">
                    {row.action} <IconArrow className="h-3.5 w-3.5 text-primary" />
                  </Link>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** The help band: a split box — media left, contact right. */
export function HelpBand({
  no,
  config,
  image,
}: {
  no: string;
  config: StoreConfig;
  image: string | null;
}) {
  return (
    <section className="sec sec--line" aria-label="Help from the store">
      <div className="wrap">
        <SectionHead
          no={no}
          label="Personal help"
          title={
            <>
              Unsure what fits? <strong>Ask the store.</strong>
            </>
          }
        />
        <div className="help__box mt-12" data-reveal>
          {image && (
            <div className="help__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" loading="lazy" />
            </div>
          )}
          <div className="help__body">
            <span className="help__beat" aria-hidden>
              <IconChat />
            </span>
            <h3 className="mt-6 font-display text-[26px] font-normal leading-tight text-cream">
              Questions before you buy? You get a real answer.
            </h3>
            <ul className="help__points">
              <li>
                <IconCheck /> Which product fits your budget and your setup
              </li>
              <li>
                <IconCheck /> Questions about an order you already placed
              </li>
              <li>
                <IconCheck /> Help with tracking and delivery, after the purchase too
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              {config.contactEmail && (
                <a href={`mailto:${config.contactEmail}`} className="btn btn--primary">
                  Contact the store <IconArrow className="arr h-4 w-4" />
                </a>
              )}
              <Link href="/track-order" className="btn btn--ghost">
                Track your order
              </Link>
            </div>
            {(config.contactEmail || config.phone) && (
              <p className="mt-6 text-sm text-muted">
                {[config.phone, config.contactEmail].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The closing section: rotating rings, a big centred heading,
 *  CTAs, and a glass contact card where the reference puts its
 *  newsletter card. */
export function FinalCta({ config }: { config: StoreConfig }) {
  return (
    <section className="fin" aria-label="Get started">
      <svg className="fin__rings" viewBox="0 0 100 100" fill="none" aria-hidden>
        <g className="spin">
          <circle cx="50" cy="50" r="48" stroke="var(--sf-primary)" strokeOpacity="0.35" strokeWidth="0.3" strokeDasharray="4 6" />
        </g>
        <g className="spin spin--rev">
          <circle cx="50" cy="50" r="38" stroke="var(--sf-secondary)" strokeOpacity="0.4" strokeWidth="0.3" strokeDasharray="2 5" />
        </g>
        <circle cx="50" cy="50" r="28" stroke="var(--sf-primary)" strokeOpacity="0.2" strokeWidth="0.3" />
      </svg>
      <div className="wrap relative">
        <div data-reveal>
          <h2 className="h2">
            Ready to upgrade your <strong>everyday tech?</strong>
          </h2>
          <p className="lead mx-auto text-center">
            Browse the live catalog, or track an order you already placed. Both take less than a
            minute.
          </p>
          <div className="fin__ctas">
            <Link href="/shop" className="btn btn--primary">
              Shop Now <IconArrow className="arr h-4 w-4" />
            </Link>
            <Link href="/track-order" className="btn btn--ghost">
              Track Order
            </Link>
          </div>
        </div>
        <div className="fin__card" data-reveal>
          <p className="fin__card-t">Talk to the store</p>
          <p className="fin__card-x">
            Questions about a product, an order or a delivery — write or call, and the store
            answers directly. No ticket numbers, no queue.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {config.contactEmail && (
              <a href={`mailto:${config.contactEmail}`} className="btn btn--primary btn--sm">
                {config.contactEmail}
              </a>
            )}
            {config.phone && (
              <a href={`tel:${config.phone.replace(/\s+/g, "")}`} className="btn btn--ghost btn--sm">
                {config.phone}
              </a>
            )}
            {!config.contactEmail && !config.phone && (
              <Link href="/account" className="btn btn--primary btn--sm">
                Go to your account
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** FAQ content built from the store's real facts (config). */
export function faqItems(config: StoreConfig): { q: string; a: string }[] {
  const names = config.paymentMethods.map((m) => m.name).filter(Boolean);
  return [
    {
      q: "How can I pay?",
      a: names.length
        ? `The store takes ${names.join(", ")}. Online payment methods are confirmed by the store after your order is placed; cash on delivery is paid when your order arrives.`
        : "Cash on Delivery is available on every order — you pay when your order arrives.",
    },
    {
      q: "How do I track my order?",
      a: "Every order gets an order number. Sign in with the account you ordered with, open Track Your Order and enter that number. Once your order ships, the courier and its tracking link appear there too.",
    },
    {
      q: "How is shipping calculated?",
      a: "Shipping is calculated at checkout from the delivery method and option you choose, and it is part of the total before you place the order. Some methods are free above a spending threshold — the cart shows your progress when one applies.",
    },
    {
      q: "Are the prices I see final?",
      a: "Yes. Totals are recomputed by the store's server at checkout, coupons included — the total shown before you place the order is the total you pay.",
    },
    {
      q: "Do I need an account to order?",
      a: "No — you can check out as a guest. An account saves your addresses for faster checkout and keeps your cart and wishlist in sync across devices.",
    },
  ];
}
