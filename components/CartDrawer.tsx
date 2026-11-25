"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiCall, formatMoney, type ShippingOptionSet, type StoreConfig } from "@/lib/api";
import { useShop } from "@/lib/store";
import { IconArrow, IconBag, IconCheck, IconClose } from "./icons";

/**
 * The cart pop-up, in the reference store's behaviour: adding a
 * product slides the cart in from the right instead of leaving the
 * shopper on the grid. It is a VIEW over the same shop state
 * (lib/store) — quantities, removal, subtotal and checkout all run
 * through the existing wiring; the /cart page remains the full
 * version. A small UI context carries only the open/closed flag.
 */
const CartUIContext = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export const useCartUI = () => useContext(CartUIContext);

export function CartUIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <CartUIContext.Provider value={{ open, setOpen }}>{children}</CartUIContext.Provider>;
}

export default function CartDrawer() {
  const { open, setOpen } = useCartUI();
  const { cart, updateQty, removeLine, cartSubtotal, cartCount } = useShop();
  const [currency, setCurrency] = useState("USD");
  const [paymentNames, setPaymentNames] = useState<string[]>([]);
  const [shipping, setShipping] = useState<ShippingOptionSet | null>(null);
  // The dual button's expanded side (hover/focus intent); null =
  // the divider rests in the centre with both zones at half width.
  const [dualSide, setDualSide] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    if (!open) return;
    setDualSide(null);
    apiCall<StoreConfig>("GET", "/api/storefront/config")
      .then((config) => {
        setCurrency(config.currency || "USD");
        setPaymentNames((config.paymentMethods || []).map((m) => m.name).filter(Boolean));
      })
      .catch(() => {});
    apiCall<ShippingOptionSet>("GET", "/api/storefront/shipping-options")
      .then(setShipping)
      .catch(() => {});
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, setOpen]);

  const freeShip = useMemo(() => {
    if (!shipping?.configured) return null;
    const method =
      shipping.methods.find((m) => m.id === shipping.defaultMethodId) || shipping.methods[0];
    if (!method?.freeAbove) return null;
    const remaining = Math.max(0, method.freeAbove - cartSubtotal);
    return { method, remaining, pct: Math.min(100, (cartSubtotal / method.freeAbove) * 100) };
  }, [shipping, cartSubtotal]);

  if (!open) return null;

  return (
    <div className="drawer-root" role="dialog" aria-modal="true" aria-label="Cart">
      <button type="button" aria-label="Close cart" className="drawer__backdrop" onClick={() => setOpen(false)} />
      <aside className="drawer">
        <div className="drawer__head">
          <h2 className="drawer__title">
            Your Cart{" "}
            <span className="text-base text-[var(--sf-muted)]">
              ({cartCount} {cartCount === 1 ? "item" : "items"})
            </span>
          </h2>
          <button type="button" className="hdr__icon" aria-label="Close cart" onClick={() => setOpen(false)}>
            <IconClose />
          </button>
        </div>

        {freeShip && cart.length > 0 && (
          <div className="border-b border-line px-[22px] py-4">
            <p className="text-[13px] text-muted">
              {freeShip.remaining > 0 ? (
                <>
                  You are <strong className="text-cream">{formatMoney(freeShip.remaining, currency)}</strong>{" "}
                  away from free shipping with {freeShip.method.name}.
                </>
              ) : (
                <>You have unlocked free shipping with {freeShip.method.name}.</>
              )}
            </p>
            <div className="ship-progress mt-2.5" aria-hidden>
              <span style={{ width: `${freeShip.pct}%` }} />
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-xl text-cream">Your cart is empty.</p>
            <p className="mt-2 text-sm text-muted">Add a product and it will show up here.</p>
            <Link href="/shop" className="btn btn--primary btn--sm mt-6" onClick={() => setOpen(false)}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="drawer__items divide-y divide-line">
              {cart.map((line) => (
                <li key={`${line.productId}-${line.variant || ""}`} className="flex gap-3.5 py-4">
                  <Link
                    href={`/product/${line.slug}`}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-ink-2"
                    onClick={() => setOpen(false)}
                  >
                    {line.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.image} alt={line.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl font-bold text-line">
                        {line.name.charAt(0)}
                      </span>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/product/${line.slug}`}
                      className="truncate font-semibold text-cream"
                      onClick={() => setOpen(false)}
                    >
                      {line.name}
                    </Link>
                    {line.variant && <p className="text-xs text-muted">{line.variant}</p>}
                    <p className="mt-0.5 text-[13px] text-muted">{formatMoney(line.price, currency)} each</p>
                    <div className="mt-auto flex items-center justify-between pt-1.5">
                      <div className="stepper">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateQty(line.productId, line.variant, line.quantity - 1)}
                          className="!px-3 !py-1 text-base"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-sm">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQty(line.productId, line.variant, line.quantity + 1)}
                          className="!px-3 !py-1 text-base"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-display font-semibold text-cream">
                        {formatMoney(line.price * line.quantity, currency)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.productId, line.variant)}
                      className="mt-1 self-start text-xs text-muted-2 transition hover:text-primary"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="drawer__foot">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg text-cream">Subtotal</span>
                <span className="font-display text-xl font-semibold text-cream">
                  {formatMoney(cartSubtotal, currency)}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-2">
                Shipping and discounts are calculated at checkout.
              </p>
              {/* Dual-action button (Ahsan, 2026-11-26): ONE
                  gradient pill, two actions — Proceed to Checkout
                  on the left, View Cart on the right — split by a
                  centre divider with each zone's icon hugging the
                  divider. Hovering (or focusing) a zone slides the
                  divider away from it: that zone expands to its
                  full text while the other compresses to its icon
                  alone. Both zones stay real links; on touch the
                  pill rests centred and each half taps its own
                  action. Below it, Shop More keeps the shopper
                  shopping (close + /shop). */}
              <div
                className={`dualbtn mt-4${dualSide ? ` dualbtn--${dualSide}` : ""}`}
                onMouseLeave={() => setDualSide(null)}
              >
                <Link
                  href="/checkout"
                  className="dualbtn__zone dualbtn__zone--left"
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setDualSide("left")}
                  onFocus={() => setDualSide("left")}
                  onBlur={() => setDualSide(null)}
                >
                  <span className="dualbtn__label">Proceed to Checkout</span>
                  <IconArrow className="dualbtn__icon" />
                </Link>
                <span className="dualbtn__divider" aria-hidden />
                <Link
                  href="/cart"
                  className="dualbtn__zone dualbtn__zone--right"
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setDualSide("right")}
                  onFocus={() => setDualSide("right")}
                  onBlur={() => setDualSide(null)}
                >
                  <IconBag className="dualbtn__icon" />
                  <span className="dualbtn__label">View Cart</span>
                </Link>
              </div>
              <Link
                href="/shop"
                className="btn btn--ghost btn--block btn--shine mt-2.5"
                onClick={() => setOpen(false)}
              >
                Shop More
              </Link>
              <ul className="mt-4 space-y-1.5 text-[13px] text-muted">
                <li className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-primary" /> Order tracking on every purchase
                </li>
                <li className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-primary" /> Transparent pricing, confirmed at checkout
                </li>
              </ul>
              {paymentNames.length > 0 && (
                <p className="mt-3 text-xs text-muted-2">Pay with {paymentNames.join(" · ")}</p>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
