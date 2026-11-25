import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import RatingStars from "@/components/RatingStars";
import ReviewForm from "@/components/ReviewForm";
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

      <nav aria-label="Breadcrumb" className="mb-6 text-xs font-medium uppercase tracking-[0.12em] text-muted-2">
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
            <Link href={`/category/${product.category.slug}`} className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 font-display text-4xl font-extrabold uppercase leading-[1.02] tracking-tight text-cream sm:text-5xl">{product.name}</h1>
          <div className="mt-6">
            <BuyPanel product={product} currency={config.currency} />
          </div>
        </div>
      </div>

      <section aria-labelledby="desc-heading" className="mt-16 border-t-2 border-cream/80 pt-7">
        <h2 id="desc-heading" className="font-display text-2xl font-extrabold uppercase tracking-tight text-cream">Description</h2>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{product.description}</p>
        {product.attributes.length > 0 && (
          <table className="mt-5 w-full max-w-lg text-sm">
            <tbody>
              {product.attributes.map((attr) => (
                <tr key={attr.name} className="border-b border-line/60 last:border-0">
                  <th className="py-2 pr-4 text-left font-medium text-muted-2">{attr.name}</th>
                  <td className="py-2 text-cream">{attr.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="reviews-heading" className="mt-14 border-t-2 border-cream/80 pt-7">
        <h2 id="reviews-heading" className="font-display text-2xl font-extrabold uppercase tracking-tight text-cream">
          Reviews{product.reviewCount > 0 ? ` (${product.reviewCount})` : ""}
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No reviews yet — be the first to share your experience.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((review) => (
              <li key={review._id} className="border border-line bg-surface p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {review.author.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-cream">{review.author.name}</p>
                    <p className="flex items-center gap-2 text-xs text-muted-2">
                      <RatingStars rating={review.rating} />
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
        <div className="mt-6">
          <ReviewForm product={product} />
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-24">
          <div className="mb-9 border-t-2 border-cream/80 pt-5">
            <h2 id="related-heading" className="font-display text-3xl font-extrabold uppercase tracking-tight text-cream sm:text-4xl">Related Products</h2>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related._id} product={related} currency={config.currency} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
