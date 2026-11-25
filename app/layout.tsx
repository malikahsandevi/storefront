import type { Metadata } from "next";
import { Nunito_Sans, Outfit } from "next/font/google";
import "./globals.css";
import CartDrawer, { CartUIProvider } from "@/components/CartDrawer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Motion from "@/components/Motion";
import { ShopProvider } from "@/lib/store";
import { themeBootScript, themeCss, themeMode } from "@/lib/theme";
import {
  SITE_URL,
  fetchCategories,
  fetchProducts,
  fetchStoreConfig,
  storeDisplayName,
  type CatalogProduct,
} from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const description =
    config.tagline ||
    `Shop at ${name} — quality products, honest prices and tracked delivery. Browse the full catalog and order online.`;
  const ogImage = config.logo || `${SITE_URL}/og-default.png`;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${name} — ${config.tagline || "Online Store"}`,
      template: `%s | ${name}`,
    },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: name,
      title: `${name} — ${config.tagline || "Online Store"}`,
      description,
      url: SITE_URL,
      images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — ${config.tagline || "Online Store"}`,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
    icons: config.favicon
      ? { icon: config.favicon }
      : { icon: "/icon.svg", apple: "/icon.svg" },
  };
}

const body = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});
const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [config, categories] = await Promise.all([fetchStoreConfig(), fetchCategories()]);
  const name = storeDisplayName(config);
  // Featured product for each main category that HAS subcategories —
  // the header's hover mega panel shows one real product of the
  // category (the catalog query for a parent category already
  // includes its subcategories' products; first in the API's
  // default order wins).
  const parentsWithSubs = new Set(
    categories.filter((c) => c.parent).map((c) => String(c.parent!._id)),
  );
  const featuredEntries = await Promise.all(
    categories
      .filter((c) => !c.parent && parentsWithSubs.has(String(c._id)))
      .map(async (c) => {
        const { products } = await fetchProducts({ category: c.slug, limit: 1 });
        return [String(c._id), products[0] ?? null] as const;
      }),
  );
  const featured: Record<string, CatalogProduct> = {};
  featuredEntries.forEach(([id, product]) => {
    if (product) featured[id] = product;
  });
  return (
    <html
      lang="en"
      data-mode={themeMode(config.appearance)}
      suppressHydrationWarning
      className={`h-full antialiased ${body.variable} ${display.variable}`}
    >
      <head>
        {/* Pre-paint: the visitor's saved theme-switch choice (if
            any) replaces the admin-kept default on <html data-mode>
            before first paint — no flash, and the admin setting
            itself is never touched (see lib/theme.ts). */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript(config.appearance) }} />
        {/* The admin-kept theme, as CSS variables (see lib/theme.ts). */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(config.appearance) }} />
      </head>
      <body className="flex min-h-full flex-col bg-ink font-sans text-cream">
        <ShopProvider>
          <CartUIProvider>
            <Header storeName={name} logo={config.logo} tagline={config.tagline} categories={categories} featured={featured} currency={config.currency} contactEmail={config.contactEmail} phone={config.phone} defaultMode={themeMode(config.appearance)} />
            <main className="w-full flex-1">{children}</main>
            <Footer config={config} categories={categories} />
            <CartDrawer />
          </CartUIProvider>
        </ShopProvider>
        <Motion />
      </body>
    </html>
  );
}
