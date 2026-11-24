# Storefront

The customer-facing storefront for the e-commerce platform. It runs on
the SAME backend as the admin panel (`ecommerce-platform` repo) — the
catalog, checkout, coupons, shipping and order tracking all come from
the backend's `/api/storefront/*` endpoints, so prices, stock and
totals are always the server's real numbers.

Built with Next.js (App Router) + TypeScript + Tailwind CSS. Catalog
pages (home, shop, categories, products) are server-rendered with ISR
so search engines see the real catalog; cart, checkout and account
pages are interactive client pages.

## Run locally

```bash
npm install
cp .env.example .env.local   # then adjust if needed
npm run dev                  # http://localhost:3000
npm run build && npm run start   # production build
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the platform backend, e.g. `https://ecommerce-backend-eta-one.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | This storefront's own public URL — used for canonical URLs, the sitemap and social cards. Set it to the real domain after deploying. |
| `NEXT_PUBLIC_STORE_NAME` | Fallback store name, used only until the name is set in the admin panel (Settings → General). The panel value wins. |

## Deploy on Vercel

1. Import this repo in Vercel (framework preset: Next.js — no build
   settings to change).
2. Add the three environment variables above for the Production
   environment (`NEXT_PUBLIC_SITE_URL` = the Vercel domain or the
   custom domain attached to the project).
3. Deploy. After the first deploy, submit `/sitemap.xml` in Google
   Search Console.

## Notes

- The store name, logo, currency, contact details and payment methods
  shown on the site come from the admin panel at runtime
  (Settings → General / Payments) — change them there, not in code.
- Shipping methods and rates come from Settings → Shipping; when no
  methods are configured, checkout charges no shipping.
- Private pages (cart, checkout, account, login, register, wishlist,
  track order) are `noindex` and disallowed in `robots.txt`.
