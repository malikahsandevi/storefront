import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShopProvider } from "@/lib/store";
import {
  SITE_URL,
  fetchCategories,
  fetchStoreConfig,
  storeDisplayName,
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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [config, categories] = await Promise.all([fetchStoreConfig(), fetchCategories()]);
  const name = storeDisplayName(config);
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable}`}>
      <body className="flex min-h-full flex-col bg-ink font-sans text-cream">
        <ShopProvider>
          <Header storeName={name} logo={config.logo} categories={categories} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">{children}</main>
          <Footer config={config} categories={categories} />
        </ShopProvider>
      </body>
    </html>
  );
}
