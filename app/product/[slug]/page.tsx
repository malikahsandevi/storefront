import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import RatingStars from "@/components/RatingStars";
import ReviewForm from "@/components/ReviewForm";
import SectionHead from "@/components/SectionHead";
import { BuyPanel, ProductGallery } from "@/components/ProductDetail";
import {
  SITE_URL,
  fetchProductBySlug,
  fetchProductReviews,
  fetchProducts,
  fetchStoreConfig,
  storeDisplayName,
} from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const title = product.metaTitle || product.name;
  const description =
    product.metaDescription ||
    product.description.slice(0, 160) ||
    `${product.name} — available at ${name}.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/product/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/product/${product.slug}`,
      type: "website",
      ...(product.image ? { images: [{ url: product.image, alt: product.name }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: product.image ? [product.image] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const [reviews, related] = await Promise.all([
    fetchProductReviews(product._id),
    product.category
      ? fetchProducts({ category: product.category.slug, limit: 8, sort: "featured" })
      : Promise.resolve({ products: [], total: 0, page: 1, pages: 0 }),
  ]);
  const relatedProducts = related.products.filter((p) => p._id !== product._id).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    ...(product.image ? { image: [product.image] } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: config.currency,
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name },
    },
  };

  return (
    <div className="py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mono-label mb-6 text-muted-2">
        <Link href="/" className="transition hover:text-cream">Home</Link>
        <span aria-hidden className="px-1.5">/</span>
        <Link href="/shop" className="transition hover:text-cream">Shop</Link>
        {product.category && (
          <>
            <span aria-hidden className="px-1.5">/</span>
            <Link href={`/category/${product.category.slug}`} className="transition hover:text-cream">
              {product.category.name}
            </Link>
          </>
        )}
        <span aria-hidden className="px-1.5">/</span>
        <span className="text-muted">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery product={product} />
        <div>
          {product.category && (
            <Link href={`/category/${product.category.slug}`} className="mono-label text-primary">
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 font-display text-4xl font-extrabold uppercase leading-[1.02] tracking-tight text-cream sm:text-5xl">{product.name}</h1>
          <div className="mt-6">
            <BuyPanel product={product} currency={config.currency} />
          </div>
        </div>
      </div>

      {/* 01 — At a glance: the spec ledger (hairline rows, mono keys). */}
      <section aria-labelledby="glance-heading" className="mt-16">
        <SectionHead no="01" title="At a Glance" id="glance-heading" />
        <div data-reveal className="vault-panel px-6 py-2 sm:px-8">
          <dl className="[&>div]:border-b [&>div]:border-line/70 [&>div:last-child]:border-b-0">
            {product.category && (
              <div className="flex items-baseline justify-between gap-6 py-3.5">
                <dt className="mono-label text-muted-2">Category</dt>
                <dd className="text-right text-sm font-medium text-cream">
                  <Link href={`/category/${product.category.slug}`} className="transition hover:text-primary">
                    {product.category.name}
                  </Link>
                </dd>
              </div>
            )}
            {product.brand && (
              <div className="flex items-baseline justify-between gap-6 py-3.5">
                <dt className="mono-label text-muted-2">Brand</dt>
                <dd className="text-right text-sm font-medium text-cream">{product.brand.name}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-6 py-3.5">
              <dt className="mono-label text-muted-2">SKU</dt>
              <dd className="text-right text-sm font-medium text-cream">{product.sku}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 py-3.5">
              <dt className="mono-label text-muted-2">Availability</dt>
              <dd className="text-right text-sm font-medium text-cream">
                {product.stock > 0 ? `In stock — ${product.stock} available` : "Out of stock"}
              </dd>
            </div>
            {product.attributes.map((attr) => (
              <div key={attr.name} className="flex items-baseline justify-between gap-6 py-3.5">
                <dt className="mono-label text-muted-2">{attr.name}</dt>
                <dd className="text-right text-sm font-medium text-cream">{attr.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 02 — Description, as a vault panel. */}
      <section aria-labelledby="desc-heading" className="mt-14">
        <SectionHead no="02" title="Description" id="desc-heading" />
        <div data-reveal className="vault-panel p-6 sm:p-8">
          <p className="whitespace-pre-line leading-relaxed text-muted">{product.description}</p>
        </div>
      </section>

      {/* 03 — Reviews, as a vault panel; the form is its own panel. */}
      <section aria-labelledby="reviews-heading" className="mt-14">
        <SectionHead no="03" title={`Reviews${product.reviewCount > 0 ? ` (${product.reviewCount})` : ""}`} id="reviews-heading" />
        <div data-reveal className="vault-panel p-6 sm:p-8">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted">No reviews yet — be the first to share your experience.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li key={review._id} className="rounded-2xl border border-line bg-ink-2 p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {review.author.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-cream">{review.author.name}</p>
                      <p className="flex items-center gap-2 text-xs text-muted-2">
                        <RatingStars rating={review.rating} className="text-primary" />
                        {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 font-semibold text-cream">{review.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{review.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-6">
          <ReviewForm product={product} />
        </div>
      </section>

      {/* 04 — Related products, under a numbered kicker head. */}
      {relatedProducts.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-24">
          <SectionHead no="04" title="Related Products" id="related-heading" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related._id} product={related} currency={config.currency} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
