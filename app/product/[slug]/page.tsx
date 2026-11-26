import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Faq from "@/components/Faq";
import ProductCard from "@/components/ProductCard";
import { BuyPanel, ProductGallery } from "@/components/ProductDetail";
import RatingStars from "@/components/RatingStars";
import ReviewAvatar from "@/components/ReviewAvatar";
import ReviewForm from "@/components/ReviewForm";
import SectionHead from "@/components/SectionHead";
import { HelpBand, StepsSection, faqItems } from "@/components/Sections";
import {
  SITE_URL,
  fetchCategories,
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

/**
 * The product page in the reference composition: a two-column
 * buy block (glow media panel | category line, display title,
 * buy panel), then the numbered sections — 01 At a Glance (the
 * spec ledger), 02 Description, 03 the three-link chain,
 * 04 Related Products, 05 Reviews, 06 FAQ, 07 the help band.
 * Metadata and the Product JSON-LD are the previous build's,
 * unchanged.
 */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const [reviews, related, allCategories] = await Promise.all([
    fetchProductReviews(product._id),
    product.category
      ? fetchProducts({ category: product.category.slug, limit: 8, sort: "featured" })
      : Promise.resolve({ products: [], total: 0, page: 1, pages: 0 }),
    fetchCategories(),
  ]);
  const relatedProducts = related.products.filter((p) => p._id !== product._id).slice(0, 4);
  const category = product.category
    ? allCategories.find((c) => c.slug === product.category?.slug) || null
    : null;
  const stepImages = [
    product.image,
    category?.image || relatedProducts[0]?.image || null,
    relatedProducts[1]?.image || null,
  ];

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

  let n = 0;
  const no = () => String(++n).padStart(2, "0");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="wrap pt-10 md:pt-14">
        <nav aria-label="Breadcrumb" className="mono-label mb-8 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-2">
          <Link href="/" className="transition hover:text-primary">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/shop" className="transition hover:text-primary">Shop</Link>
          {product.category && (
            <>
              <span aria-hidden>/</span>
              <Link href={`/category/${product.category.slug}`} className="transition hover:text-primary">
                {product.category.name}
              </Link>
            </>
          )}
          <span aria-hidden>/</span>
          <span className="text-muted">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <ProductGallery product={product} />
          <div>
            {product.category && (
              <Link href={`/category/${product.category.slug}`} className="mono-label text-primary">
                {product.category.name}
              </Link>
            )}
            <h1 className="mt-3 font-display text-[clamp(1.9rem,3vw,2.6rem)] font-normal leading-[1.05] tracking-[-0.02em] text-cream">
              {product.name}
            </h1>
            <div className="mt-6">
              <BuyPanel product={product} currency={config.currency} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 01 At a Glance ── */}
      <section className="sec sec--flat sec--line" aria-labelledby="glance-heading">
        <div className="wrap">
          <SectionHead
            no={no()}
            label="At a Glance"
            title={
              <>
                At a <strong>Glance</strong>
              </>
            }
            id="glance-heading"
          />
          <div className="ledg__box" data-reveal>
            <div className="ledg__top">
              <span>Product record · live from the catalog</span>
              <span>{product.sku}</span>
            </div>
            <dl>
              {product.category && (
                <div className="ledg__row !grid-cols-[130px_1fr] md:!grid-cols-[130px_1fr]">
                  <dt className="mono-label text-muted-2">Category</dt>
                  <dd className="text-[15px] text-cream">
                    <Link href={`/category/${product.category.slug}`} className="transition hover:text-primary">
                      {product.category.name}
                    </Link>
                  </dd>
                </div>
              )}
              {product.brand && (
                <div className="ledg__row !grid-cols-[130px_1fr] md:!grid-cols-[130px_1fr]">
                  <dt className="mono-label text-muted-2">Brand</dt>
                  <dd className="text-[15px] text-cream">{product.brand.name}</dd>
                </div>
              )}
              <div className="ledg__row !grid-cols-[130px_1fr] md:!grid-cols-[130px_1fr]">
                <dt className="mono-label text-muted-2">SKU</dt>
                <dd className="text-[15px] text-cream">{product.sku}</dd>
              </div>
              <div className="ledg__row !grid-cols-[130px_1fr] md:!grid-cols-[130px_1fr]">
                <dt className="mono-label text-muted-2">Availability</dt>
                <dd className="text-[15px] text-cream">
                  {product.stock > 0 ? `In stock — ${product.stock} available` : "Out of stock"}
                </dd>
              </div>
              {product.attributes.map((attr) => (
                <div key={attr.name} className="ledg__row !grid-cols-[130px_1fr] md:!grid-cols-[130px_1fr]">
                  <dt className="mono-label text-muted-2">{attr.name}</dt>
                  <dd className="text-[15px] text-cream">{attr.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── 02 Description ── */}
      <section className="sec sec--line" aria-labelledby="desc-heading">
        <div className="wrap">
          <SectionHead
            no={no()}
            label="Description"
            title={
              <>
                About this <strong>product</strong>
              </>
            }
            id="desc-heading"
          />
          <div className="panel panel--pad" data-reveal>
            <p className="whitespace-pre-line leading-relaxed text-muted">{product.description}</p>
          </div>
        </div>
      </section>

      {/* ── 03 How ordering works ── */}
      <StepsSection no={no()} images={stepImages} />

      {/* ── 04 Related products ── */}
      {relatedProducts.length > 0 && (
        <section className="sec sec--line" aria-labelledby="related-heading">
          <div className="wrap">
            <SectionHead
              no={no()}
              label="Related Products"
              title={
                <>
                  Related <strong>Products</strong>
                </>
              }
              id="related-heading"
              href={product.category ? `/category/${product.category.slug}` : "/shop"}
              hrefLabel="View category"
              split
            />
            <div className="pgrid">
              {relatedProducts.map((item) => (
                <ProductCard key={item._id} product={item} currency={config.currency} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 05 Reviews ── */}
      <section className="sec sec--flat sec--line" aria-labelledby="reviews-heading">
        <div className="wrap">
          <SectionHead
            no={no()}
            label="Reviews"
            title={
              <>
                Customer <strong>Reviews</strong>
              </>
            }
            id="reviews-heading"
          />
          <div className="panel panel--pad" data-reveal>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">No reviews yet — be the first to share your experience.</p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li key={review._id} className="rounded-2xl border border-line bg-ink-2 p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <ReviewAvatar name={review.author.name} avatar={review.author.avatar} />
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
        </div>
      </section>

      {/* ── 06 FAQ ── */}
      <section className="sec sec--line" aria-labelledby="product-faq-heading">
        <div className="wrap">
          <SectionHead
            no={no()}
            label="Good to know"
            title={
              <>
                Questions, <strong>answered.</strong>
              </>
            }
            id="product-faq-heading"
          />
          <Faq items={faqItems(config)} />
        </div>
      </section>

      {/* ── 07 Help band ── */}
      <HelpBand no={no()} config={config} image={product.image} />
    </>
  );
}
