import Link from "next/link";

/** 404 in the vault language: giant gradient numeral, display
 *  heading, the two pill actions. */
export default function NotFound() {
  return (
    <div className="wrap py-24 text-center">
      <p aria-hidden className="grad-text font-display text-8xl font-semibold tracking-tighter md:text-9xl">
        404
      </p>
      <h1 className="mt-5 font-display text-[clamp(2.1rem,4.5vw,3rem)] font-normal leading-[1.05] tracking-[-0.02em] text-cream">
        Page not found
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        The page you are looking for does not exist or has moved. Browse the shop instead — everything there is real and in stock.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn--primary">Go to Shop</Link>
        <Link href="/" className="btn btn--ghost">Home</Link>
      </div>
    </div>
  );
}
