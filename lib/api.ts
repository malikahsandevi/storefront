// The storefront's one door to the platform backend. Every page —
// server-rendered catalog pages and client account/cart pages alike —
// reads through here, so the API base and payload shapes live in one
// place. All data is the store's REAL catalog: nothing is invented
// client-side.

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://ecommerce-backend-eta-one.vercel.app"
).replace(/\/+$/, "");

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100"
).replace(/\/+$/, "");

export interface PaletteColors {
  primary: string;
  secondary: string;
  text: string;
  background: string;
}

/** The theme the admin keeps (Settings → Appearance), served by the
 *  public config: the palette id, the resolved mode, and the palette's
 *  own colour values. The storefront's CSS variables are driven by
 *  these values — the frontend keeps no colour copy of its own. */
export interface StoreAppearance {
  palette: string;
  mode: "dark" | "light" | "system";
  colors: PaletteColors;
  colorsDark: PaletteColors;
  colorsLight: PaletteColors;
}

export interface StoreConfig {
  storeName: string;
  tagline: string;
  logo: string;
  favicon: string;
  currency: string;
  timeZone: string;
  contactEmail: string;
  phone: string;
  paymentMethods: { name: string; description: string }[];
  appearance: StoreAppearance;
}

export interface ProductImage {
  url: string;
  alt: string;
  isMain: boolean;
}

export interface CatalogProduct {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  image: string;
  images: ProductImage[];
  category: { _id: string; name: string; slug: string } | null;
  brand: { _id: string; name: string; slug: string } | null;
  variants: { name: string; options: string[]; price?: number }[];
  attributes: { name: string; value: string }[];
  tags: string[];
  averageRating: number;
  reviewCount: number;
  metaTitle: string;
  metaDescription: string;
  createdAt: string;
}

export interface CatalogCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parent: { _id: string; name: string; slug: string } | null;
  productsCount: number;
}

export interface ProductReview {
  _id: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  author: { name: string; avatar: string };
}

export interface ShippingOptionSet {
  configured: boolean;
  methods: { id: string; name: string; charge: number; freeAbove: number | null; estimatedDays: string }[];
  deliveryOptions: { id: string; name: string; chargeAdjustment: number; isPickup: boolean }[];
  defaultMethodId: string;
  defaultDeliveryOptionId: string;
}

export interface Quote {
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  coupon: { code: string; discount: number } | null;
  shipping: {
    methodId: string;
    methodName: string;
    deliveryOptionId: string;
    deliveryOptionName: string;
    zoneName: string;
    freeApplied: boolean;
  } | null;
}

export interface PlacedOrder {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  items: { name: string; price: number; quantity: number; image: string }[];
  createdAt: string;
}

export interface TrackedOrder extends PlacedOrder {
  city: string;
  country: string;
  shipment: {
    courierId: string;
    courierName: string;
    trackingNumber: string;
    shippedAt: string | null;
    deliveredAt: string | null;
    trackingUrl: string;
  };
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  addresses: CustomerAddress[];
  createdAt: string;
  cart: { product: CatalogProduct; quantity: number }[];
  wishlist: CatalogProduct[];
}

export interface MyOrder {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  items: { name: string; price: number; quantity: number; image: string }[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  shippingAddress: CustomerAddress | null;
  createdAt: string;
  shipment: TrackedOrder["shipment"];
}

/** Brand-neutral fallback theme (the Sunset Orange set — the
 *  palette the store ships with) — used only when the config cannot
 *  be reached. */
export const FALLBACK_APPEARANCE: StoreAppearance = {
  palette: "sunset-orange",
  mode: "dark",
  colors: { primary: "#f97316", secondary: "#334155", text: "#f3f4f6", background: "#0b0f19" },
  colorsDark: { primary: "#f97316", secondary: "#334155", text: "#f3f4f6", background: "#0b0f19" },
  colorsLight: { primary: "#f97316", secondary: "#334155", text: "#111827", background: "#ffffff" },
};

export const FALLBACK_CONFIG: StoreConfig = {
  storeName: "",
  tagline: "",
  logo: "",
  favicon: "",
  currency: "USD",
  timeZone: "Asia/Karachi",
  contactEmail: "",
  phone: "",
  paymentMethods: [],
  appearance: FALLBACK_APPEARANCE,
};

/** The store's display name: the admin panel's value wins; the env
 *  fallback covers a store whose name is not set in the panel yet. */
export function storeDisplayName(config: StoreConfig): string {
  return config.storeName || process.env.NEXT_PUBLIC_STORE_NAME || "Store";
}

export function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(Number(amount) || 0);
  } catch {
    return `$${(Number(amount) || 0).toFixed(2)}`;
  }
}

export function discountPercent(product: CatalogProduct): number | null {
  if (!product.comparePrice || product.comparePrice <= product.price) return null;
  return Math.round((1 - product.price / product.comparePrice) * 100);
}

// ── Server-side reads (ISR: revalidated every minute) ──────────────
async function serverGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

export async function fetchStoreConfig(): Promise<StoreConfig> {
  try {
    const config = await serverGet<StoreConfig>("/api/storefront/config");
    return { ...config, appearance: config.appearance || FALLBACK_APPEARANCE };
  } catch {
    return FALLBACK_CONFIG;
  }
}

export async function fetchCategories(): Promise<CatalogCategory[]> {
  try {
    return await serverGet<CatalogCategory[]>("/api/storefront/categories");
  } catch {
    return [];
  }
}

export interface ProductQuery {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function fetchProducts(
  query: ProductQuery = {},
): Promise<{ products: CatalogProduct[]; total: number; page: number; pages: number }> {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);
  if (query.minPrice) params.set("minPrice", query.minPrice);
  if (query.maxPrice) params.set("maxPrice", query.maxPrice);
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  params.set("limit", String(query.limit || 24));
  try {
    return await serverGet(`/api/storefront/products?${params.toString()}`);
  } catch {
    return { products: [], total: 0, page: 1, pages: 0 };
  }
}

export async function fetchProductBySlug(slug: string): Promise<CatalogProduct | null> {
  try {
    const res = await fetch(`${API_URL}/api/storefront/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as CatalogProduct;
  } catch {
    return null;
  }
}

export async function fetchProductReviews(productId: string): Promise<ProductReview[]> {
  try {
    return await serverGet<ProductReview[]>(`/api/storefront/products/${productId}/reviews`);
  } catch {
    return [];
  }
}

// ── Client-side calls (cart, checkout, account) ────────────────────
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiCall<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "Something went wrong. Please try again.";
    throw new ApiError(res.status, message);
  }
  return payload as T;
}
