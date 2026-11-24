"use client";

// The shopper-side state: session, cart and wishlist. Guests keep
// everything in localStorage; signed-in customers ALSO sync to their
// account on the server (the User record's cart/wishlist), so the
// cart follows them across devices. The server is only ever a mirror
// — checkout always re-prices from the backend.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiCall, type CatalogProduct, type CustomerProfile } from "./api";

export type ProductLike = Pick<
  CatalogProduct,
  "_id" | "slug" | "name" | "image" | "price" | "comparePrice" | "stock"
>;

export interface SessionUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
}

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  quantity: number;
  variant?: string;
}

export interface WishlistEntry {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  comparePrice: number | null;
  stock: number;
}

interface ShopState {
  user: SessionUser | null;
  ready: boolean;
  cart: CartLine[];
  wishlist: WishlistEntry[];
  cartCount: number;
  cartSubtotal: number;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  addToCart: (product: ProductLike, quantity?: number, variant?: string) => void;
  updateQty: (productId: string, variant: string | undefined, quantity: number) => void;
  removeLine: (productId: string, variant?: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: ProductLike) => void;
  isWishlisted: (productId: string) => boolean;
}

const ShopContext = createContext<ShopState | null>(null);

const AUTH_KEY = "sf_auth";
const CART_KEY = "sf_cart";
const WISHLIST_KEY = "sf_wishlist";

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

const lineKey = (productId: string, variant?: string) => `${productId}::${variant || ""}`;

export function ShopProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load from localStorage.
  useEffect(() => {
    setUser(readJSON<SessionUser>(AUTH_KEY));
    setCart(readJSON<CartLine[]>(CART_KEY) || []);
    setWishlist(readJSON<WishlistEntry[]>(WISHLIST_KEY) || []);
    hydrated.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (hydrated.current) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    if (hydrated.current) localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);
  useEffect(() => {
    if (hydrated.current) {
      if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      else localStorage.removeItem(AUTH_KEY);
    }
  }, [user]);

  // Mirror cart + wishlist onto the account (debounced, best-effort:
  // a failed sync never breaks shopping — the local copy stands).
  const scheduleSync = useCallback(
    (nextCart: CartLine[], nextWishlist: WishlistEntry[], session: SessionUser | null) => {
      if (!session) return;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        apiCall("PUT", "/api/storefront/me/cart", {
          items: nextCart.map((line) => ({ product: line.productId, quantity: line.quantity })),
        }, session.token).catch(() => {});
        apiCall("PUT", "/api/storefront/me/wishlist", {
          productIds: nextWishlist.map((entry) => entry.productId),
        }, session.token).catch(() => {});
      }, 600);
    },
    [],
  );

  // On sign-in: pull the account's saved cart/wishlist and merge with
  // what this device already holds (union; local quantity wins on a
  // clash so the shopper's latest action is what survives).
  const adoptSession = useCallback(
    async (session: SessionUser) => {
      setUser(session);
      try {
        const profile = await apiCall<CustomerProfile>("GET", "/api/storefront/me", undefined, session.token);
        const serverCart: CartLine[] = (profile.cart || []).map((entry) => ({
          productId: entry.product._id,
          slug: entry.product.slug,
          name: entry.product.name,
          image: entry.product.image,
          price: entry.product.price,
          comparePrice: entry.product.comparePrice,
          stock: entry.product.stock,
          quantity: entry.quantity,
        }));
        const serverWishlist: WishlistEntry[] = (profile.wishlist || []).map((product) => ({
          productId: product._id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          price: product.price,
          comparePrice: product.comparePrice,
          stock: product.stock,
        }));
        setCart((local) => {
          const merged = new Map(serverCart.map((line) => [lineKey(line.productId, line.variant), line]));
          for (const line of local) merged.set(lineKey(line.productId, line.variant), line);
          const next = [...merged.values()];
          scheduleSync(next, wishlist, session);
          return next;
        });
        setWishlist((local) => {
          const merged = new Map(serverWishlist.map((entry) => [entry.productId, entry]));
          for (const entry of local) merged.set(entry.productId, entry);
          const next = [...merged.values()];
          scheduleSync(cart, next, session);
          return next;
        });
      } catch {
        // Account read failed — keep the local state as-is.
      }
    },
    [cart, wishlist, scheduleSync],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await apiCall<SessionUser>("POST", "/api/storefront/auth/login", { email, password });
      await adoptSession(session);
    },
    [adoptSession],
  );

  const register = useCallback(
    async (data: { firstName: string; lastName: string; email: string; password: string }) => {
      const session = await apiCall<SessionUser>("POST", "/api/storefront/auth/register", data);
      await adoptSession(session);
    },
    [adoptSession],
  );

  const logout = useCallback(() => setUser(null), []);

  const addToCart = useCallback(
    (product: ProductLike, quantity = 1, variant?: string) => {
      setCart((prev) => {
        const key = lineKey(product._id, variant);
        const existing = prev.find((line) => lineKey(line.productId, line.variant) === key);
        let next: CartLine[];
        if (existing) {
          next = prev.map((line) =>
            lineKey(line.productId, line.variant) === key
              ? { ...line, quantity: Math.min(line.stock || quantity, line.quantity + quantity) }
              : line,
          );
        } else {
          next = [
            ...prev,
            {
              productId: product._id,
              slug: product.slug,
              name: product.name,
              image: product.image,
              price: product.price,
              comparePrice: product.comparePrice,
              stock: product.stock,
              quantity: Math.max(1, Math.min(product.stock || 1, quantity)),
              variant,
            },
          ];
        }
        scheduleSync(next, wishlist, user);
        return next;
      });
    },
    [scheduleSync, user, wishlist],
  );

  const updateQty = useCallback(
    (productId: string, variant: string | undefined, quantity: number) => {
      setCart((prev) => {
        const next = prev
          .map((line) =>
            lineKey(line.productId, line.variant) === lineKey(productId, variant)
              ? { ...line, quantity: Math.max(0, Math.min(line.stock || quantity, quantity)) }
              : line,
          )
          .filter((line) => line.quantity > 0);
        scheduleSync(next, wishlist, user);
        return next;
      });
    },
    [scheduleSync, user, wishlist],
  );

  const removeLine = useCallback(
    (productId: string, variant?: string) => {
      setCart((prev) => {
        const next = prev.filter((line) => lineKey(line.productId, line.variant) !== lineKey(productId, variant));
        scheduleSync(next, wishlist, user);
        return next;
      });
    },
    [scheduleSync, user, wishlist],
  );

  const clearCart = useCallback(() => {
    setCart((prev) => {
      scheduleSync([], wishlist, user);
      return prev.length ? [] : prev;
    });
  }, [scheduleSync, user, wishlist]);

  const toggleWishlist = useCallback(
    (product: ProductLike) => {
      setWishlist((prev) => {
        const exists = prev.some((entry) => entry.productId === product._id);
        const next = exists
          ? prev.filter((entry) => entry.productId !== product._id)
          : [
              ...prev,
              {
                productId: product._id,
                slug: product.slug,
                name: product.name,
                image: product.image,
                price: product.price,
                comparePrice: product.comparePrice,
                stock: product.stock,
              },
            ];
        scheduleSync(cart, next, user);
        return next;
      });
    },
    [cart, scheduleSync, user],
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.some((entry) => entry.productId === productId),
    [wishlist],
  );

  const value = useMemo<ShopState>(
    () => ({
      user,
      ready,
      cart,
      wishlist,
      cartCount: cart.reduce((sum, line) => sum + line.quantity, 0),
      cartSubtotal: cart.reduce((sum, line) => sum + line.price * line.quantity, 0),
      login,
      register,
      logout,
      addToCart,
      updateQty,
      removeLine,
      clearCart,
      toggleWishlist,
      isWishlisted,
    }),
    [user, ready, cart, wishlist, login, register, logout, addToCart, updateQty, removeLine, clearCart, toggleWishlist, isWishlisted],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopState {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
